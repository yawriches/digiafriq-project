-- ============================================================================
-- WITHDRAWAL MANAGEMENT SYSTEM
-- Secure multi-admin approval workflow with batch processing
-- ============================================================================

-- ============================================================================
-- CLEAN RESET
-- ============================================================================

DROP VIEW IF EXISTS v_pending_withdrawals;
DROP VIEW IF EXISTS v_approved_withdrawals;
DROP VIEW IF EXISTS v_batch_summary;
DROP VIEW IF EXISTS v_user_withdrawal_history;

DROP TABLE IF EXISTS paystack_recipients CASCADE;
DROP TABLE IF EXISTS withdrawal_audit_log CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS withdrawal_batches CASCADE;

-- ============================================================================
-- 1. WITHDRAWAL BATCHES
-- ============================================================================

CREATE TABLE withdrawal_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    batch_reference VARCHAR(30) NOT NULL UNIQUE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('PAYSTACK', 'KORA')),

    total_withdrawals INTEGER NOT NULL DEFAULT 0,
    total_amount_usd DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_amount_local DECIMAL(14,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN (
            'DRAFT','READY','PROCESSING',
            'COMPLETED','PARTIALLY_COMPLETED','FAILED'
        )),

    successful_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,

    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,

    csv_generated_at TIMESTAMPTZ,
    csv_file_url TEXT,

    notes TEXT
);

-- ============================================================================
-- 2. WITHDRAWALS
-- ============================================================================

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    amount_usd DECIMAL(12,2) NOT NULL CHECK (amount_usd >= 8.00),
    amount_local DECIMAL(12,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    exchange_rate DECIMAL(10,4),

    payout_channel VARCHAR(20) NOT NULL
        CHECK (payout_channel IN ('bank','mobile_money')),

    account_details JSONB NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING','APPROVED','REJECTED',
            'PROCESSING','PAID','FAILED'
        )),

    batch_id UUID REFERENCES withdrawal_batches(id) ON DELETE SET NULL,

    provider VARCHAR(20),
    provider_reference VARCHAR(100),
    provider_response JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    processed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,

    user_ip INET,
    user_agent TEXT,
    notes TEXT
);

-- ============================================================================
-- 3. AUDIT LOG
-- ============================================================================

CREATE TABLE withdrawal_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES withdrawal_batches(id) ON DELETE CASCADE,

    admin_id UUID NOT NULL REFERENCES auth.users(id),
    admin_email TEXT,

    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    details JSONB,
    reason TEXT,

    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. PAYSTACK RECIPIENTS
-- ============================================================================

CREATE TABLE paystack_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    recipient_code VARCHAR(50) NOT NULL UNIQUE,
    recipient_type VARCHAR(20) NOT NULL,

    bank_code VARCHAR(20),
    account_number VARCHAR(30),
    account_name VARCHAR(100),

    mobile_number VARCHAR(20),
    network_code VARCHAR(20),

    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_batch_id ON withdrawals(batch_id);
CREATE INDEX idx_batches_status ON withdrawal_batches(status);

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE paystack_recipients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. FUNCTIONS (REFERENCE GENERATORS)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_withdrawal_reference()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_date TEXT := to_char(now(),'YYYYMMDD');
    v_seq INT;
BEGIN
    SELECT COALESCE(MAX(
        CAST(substring(reference FROM 'WD-'||v_date||'-(\d+)') AS INT)
    ),0)+1 INTO v_seq
    FROM withdrawals
    WHERE reference LIKE 'WD-'||v_date||'-%';

    RETURN 'WD-'||v_date||'-'||lpad(v_seq::TEXT,4,'0');
END;
$$;

CREATE OR REPLACE FUNCTION generate_batch_reference()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_date TEXT := to_char(now(),'YYYYMMDD');
    v_seq INT;
BEGIN
    SELECT COALESCE(MAX(
        CAST(substring(batch_reference FROM 'BATCH-'||v_date||'-(\d+)') AS INT)
    ),0)+1 INTO v_seq
    FROM withdrawal_batches
    WHERE batch_reference LIKE 'BATCH-'||v_date||'-%';

    RETURN 'BATCH-'||v_date||'-'||lpad(v_seq::TEXT,3,'0');
END;
$$;

-- ============================================================================
-- 8. VIEWS (FIXED)
-- ============================================================================

-- Pending withdrawals
CREATE OR REPLACE VIEW v_pending_withdrawals AS
SELECT w.*, p.full_name, p.email
FROM withdrawals w
JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'PENDING';

-- Approved withdrawals
CREATE OR REPLACE VIEW v_approved_withdrawals AS
SELECT w.*, p.full_name, p.email
FROM withdrawals w
JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'APPROVED' AND w.batch_id IS NULL;

-- ✅ FIXED BATCH SUMMARY (NO DUPLICATE failed_count)
CREATE OR REPLACE VIEW v_batch_summary AS
SELECT
    b.*,

    creator.full_name   AS created_by_name,
    finalizer.full_name AS finalized_by_name,
    processor.full_name AS processed_by_name,

    (SELECT COUNT(*) FROM withdrawals w1
     WHERE w1.batch_id = b.id AND w1.status = 'PAID')
        AS paid_withdrawals_count,

    (SELECT COUNT(*) FROM withdrawals w2
     WHERE w2.batch_id = b.id AND w2.status = 'FAILED')
        AS failed_withdrawals_count

FROM withdrawal_batches b
LEFT JOIN profiles creator   ON b.created_by = creator.id
LEFT JOIN profiles finalizer ON b.finalized_by = finalizer.id
LEFT JOIN profiles processor ON b.processed_by = processor.id
ORDER BY b.created_at DESC;

-- User history
CREATE OR REPLACE VIEW v_user_withdrawal_history AS
SELECT *
FROM withdrawals
ORDER BY created_at DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE withdrawals IS 'User withdrawal requests with full lifecycle tracking';
COMMENT ON TABLE withdrawal_batches IS 'Weekly batch processing for bulk payouts';
COMMENT ON TABLE withdrawal_audit_log IS 'Admin audit trail';
COMMENT ON TABLE paystack_recipients IS 'Paystack bulk payout recipients';

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Withdrawals: Users see own, admins see all
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON withdrawals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update withdrawals" ON withdrawals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Batches: Admin only
CREATE POLICY "Admins can manage batches" ON withdrawal_batches
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Audit log: Admin view, system insert
CREATE POLICY "Admins can view audit logs" ON withdrawal_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Anyone can insert audit logs" ON withdrawal_audit_log
    FOR INSERT WITH CHECK (true);

-- Recipients: Users see own, admins manage all
CREATE POLICY "Users can view own recipients" ON paystack_recipients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage recipients" ON paystack_recipients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================================
-- 10. CORE FUNCTIONS
-- ============================================================================

-- Create withdrawal batch
CREATE OR REPLACE FUNCTION create_withdrawal_batch(
    p_admin_id UUID,
    p_provider VARCHAR,
    p_currency VARCHAR DEFAULT 'GHS',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_batch_id UUID;
    v_reference TEXT;
BEGIN
    v_reference := generate_batch_reference();
    
    INSERT INTO withdrawal_batches (
        batch_reference, provider, currency, created_by, notes
    ) VALUES (
        v_reference, p_provider, p_currency, p_admin_id, p_notes
    )
    RETURNING id INTO v_batch_id;
    
    INSERT INTO withdrawal_audit_log (
        batch_id, admin_id, action, new_status, details
    ) VALUES (
        v_batch_id, p_admin_id, 'BATCH_CREATED', 'DRAFT',
        jsonb_build_object('provider', p_provider, 'currency', p_currency)
    );
    
    RETURN v_batch_id;
END;
$$;

-- Add withdrawal to batch
CREATE OR REPLACE FUNCTION add_withdrawal_to_batch(
    p_withdrawal_id UUID,
    p_batch_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_withdrawal_status VARCHAR;
    v_batch_status VARCHAR;
    v_amount DECIMAL;
BEGIN
    SELECT status, amount_usd INTO v_withdrawal_status, v_amount
    FROM withdrawals WHERE id = p_withdrawal_id;
    
    IF v_withdrawal_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Can only add APPROVED withdrawals to batch';
    END IF;
    
    SELECT status INTO v_batch_status
    FROM withdrawal_batches WHERE id = p_batch_id;
    
    IF v_batch_status NOT IN ('DRAFT', 'READY') THEN
        RAISE EXCEPTION 'Cannot add to batch with status: %', v_batch_status;
    END IF;
    
    UPDATE withdrawals SET batch_id = p_batch_id WHERE id = p_withdrawal_id;
    
    UPDATE withdrawal_batches
    SET total_withdrawals = total_withdrawals + 1,
        total_amount_usd = total_amount_usd + v_amount
    WHERE id = p_batch_id;
    
    INSERT INTO withdrawal_audit_log (
        withdrawal_id, batch_id, admin_id, action, details
    ) VALUES (
        p_withdrawal_id, p_batch_id, p_admin_id, 'ADDED_TO_BATCH',
        jsonb_build_object('amount_usd', v_amount)
    );
    
    RETURN TRUE;
END;
$$;

-- Finalize batch
CREATE OR REPLACE FUNCTION finalize_batch(
    p_batch_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE withdrawal_batches
    SET status = 'READY',
        finalized_at = now(),
        finalized_by = p_admin_id
    WHERE id = p_batch_id AND status = 'DRAFT';
    
    INSERT INTO withdrawal_audit_log (
        batch_id, admin_id, action, previous_status, new_status
    ) VALUES (
        p_batch_id, p_admin_id, 'BATCH_FINALIZED', 'DRAFT', 'READY'
    );
    
    RETURN TRUE;
END;
$$;

-- Approve withdrawal
CREATE OR REPLACE FUNCTION approve_withdrawal(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_status VARCHAR;
BEGIN
    SELECT status INTO v_current_status FROM withdrawals WHERE id = p_withdrawal_id;
    
    IF v_current_status != 'PENDING' THEN
        RAISE EXCEPTION 'Can only approve PENDING withdrawals';
    END IF;
    
    UPDATE withdrawals
    SET status = 'APPROVED', approved_at = now(), approved_by = p_admin_id
    WHERE id = p_withdrawal_id;
    
    INSERT INTO withdrawal_audit_log (
        withdrawal_id, admin_id, action, previous_status, new_status, reason
    ) VALUES (
        p_withdrawal_id, p_admin_id, 'APPROVED', 'PENDING', 'APPROVED', p_notes
    );
    
    RETURN TRUE;
END;
$$;

-- Reject withdrawal
CREATE OR REPLACE FUNCTION reject_withdrawal(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_status VARCHAR;
BEGIN
    SELECT status INTO v_current_status FROM withdrawals WHERE id = p_withdrawal_id;
    
    IF v_current_status != 'PENDING' THEN
        RAISE EXCEPTION 'Can only reject PENDING withdrawals';
    END IF;
    
    UPDATE withdrawals
    SET status = 'REJECTED', rejected_at = now(), rejected_by = p_admin_id, rejection_reason = p_reason
    WHERE id = p_withdrawal_id;
    
    INSERT INTO withdrawal_audit_log (
        withdrawal_id, admin_id, action, previous_status, new_status, reason
    ) VALUES (
        p_withdrawal_id, p_admin_id, 'REJECTED', 'PENDING', 'REJECTED', p_reason
    );
    
    RETURN TRUE;
END;
$$;

-- Mark withdrawal paid
CREATE OR REPLACE FUNCTION mark_withdrawal_paid(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_provider_reference VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_status VARCHAR;
BEGIN
    SELECT status INTO v_current_status FROM withdrawals WHERE id = p_withdrawal_id;
    
    IF v_current_status NOT IN ('APPROVED', 'PROCESSING') THEN
        RAISE EXCEPTION 'Can only mark APPROVED/PROCESSING withdrawals as paid';
    END IF;
    
    UPDATE withdrawals
    SET status = 'PAID', paid_at = now(), provider_reference = COALESCE(p_provider_reference, provider_reference)
    WHERE id = p_withdrawal_id;
    
    INSERT INTO withdrawal_audit_log (
        withdrawal_id, admin_id, action, previous_status, new_status
    ) VALUES (
        p_withdrawal_id, p_admin_id, 'MARKED_PAID', v_current_status, 'PAID'
    );
    
    RETURN TRUE;
END;
$$;

-- Mark withdrawal failed
CREATE OR REPLACE FUNCTION mark_withdrawal_failed(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_failure_reason TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_status VARCHAR;
BEGIN
    SELECT status INTO v_current_status FROM withdrawals WHERE id = p_withdrawal_id;
    
    IF v_current_status NOT IN ('APPROVED', 'PROCESSING') THEN
        RAISE EXCEPTION 'Can only mark APPROVED/PROCESSING withdrawals as failed';
    END IF;
    
    UPDATE withdrawals
    SET status = 'FAILED', failed_at = now(), failure_reason = p_failure_reason
    WHERE id = p_withdrawal_id;
    
    INSERT INTO withdrawal_audit_log (
        withdrawal_id, admin_id, action, previous_status, new_status, reason
    ) VALUES (
        p_withdrawal_id, p_admin_id, 'MARKED_FAILED', v_current_status, 'FAILED', p_failure_reason
    );
    
    RETURN TRUE;
END;
$$;
