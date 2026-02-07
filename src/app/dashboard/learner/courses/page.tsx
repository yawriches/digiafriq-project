"use client"
import React from 'react'
import ProgramsList from '@/components/courses/ProgramsList'

const MyCoursesPage = () => {
  return (
    <div className="space-y-6">
      <ProgramsList 
        onCourseClick={(course) => {
          window.location.href = `/dashboard/learner/courses/${course.id}`
        }}
      />
    </div>
  )
}

export default MyCoursesPage
