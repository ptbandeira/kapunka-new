import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import CourseCard from '../components/CourseCard';
import type { Course } from '../types';

const Academy: React.FC = () => {
    const { t } = useLanguage();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/content/courses.json')
            .then(res => res.json())
            .then(data => {
                setCourses(data.courses);
                setLoading(false);
            });
    }, []);

  return (
    <div>
        <Helmet>
            <title>{t('academy.headerTitle')} | Kapunka Skincare</title>
            <meta name="description" content={t('academy.headerSubtitle')} />
        </Helmet>
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
          >
            <span data-nlv-field-path="translations.en.academy.headerTitle">{t('academy.headerTitle')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
          >
            <span data-nlv-field-path="translations.en.academy.headerSubtitle">{t('academy.headerSubtitle')}</span>
          </motion.p>
        </div>
      </header>

      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center mb-12" data-nlv-field-path="translations.en.academy.coursesTitle">{t('academy.coursesTitle')}</h2>
          {loading ? (
            <p className="text-center" data-nlv-field-path="translations.en.common.loadingCourses">{t('common.loadingCourses')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Academy;