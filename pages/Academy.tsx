import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import CourseCard from '../components/CourseCard';
import type { Course } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import Seo from '../components/Seo';

interface CoursesResponse {
    courses?: Course[];
}

const Academy: React.FC = () => {
    const { t, language } = useLanguage();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { contentVersion } = useVisualEditorSync();

    useEffect(() => {
        let isMounted = true;

        const loadCourses = async () => {
            setLoading(true);
            try {
                const data = await fetchVisualEditorJson<CoursesResponse>('/content/courses.json');
                if (!isMounted) {
                    return;
                }
                setCourses(Array.isArray(data.courses) ? data.courses : []);
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load courses', error);
                    setCourses([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadCourses().catch((error) => {
            console.error('Unhandled error while loading courses', error);
        });

        return () => {
            isMounted = false;
        };
    }, [contentVersion]);

  const pageTitle = `${t('academy.headerTitle')} | Kapunka Skincare`;
  const description = t('academy.headerSubtitle');

  return (
    <div>
      <Seo title={pageTitle} description={description} locale={language} />
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...getVisualEditorAttributes(`translations.${language}.academy.headerTitle`)}
          >
            {t('academy.headerTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            {...getVisualEditorAttributes(`translations.${language}.academy.headerSubtitle`)}
          >
            {t('academy.headerSubtitle')}
          </motion.p>
        </div>
      </header>

      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-semibold text-center mb-12"
            {...getVisualEditorAttributes(`translations.${language}.academy.coursesTitle`)}
          >
            {t('academy.coursesTitle')}
          </h2>
          {loading ? (
            <p className="text-center" {...getVisualEditorAttributes(`translations.${language}.common.loadingCourses`)}>
              {t('common.loadingCourses')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {courses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  fieldPath={`courses.courses.${index}`}
                  data-sb-field-path={`.${index}`}
                />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Academy;
