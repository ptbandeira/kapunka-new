
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const { translate, t } = useLanguage();
  const baseFieldPath = `courses.${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
      data-nlv-field-path={baseFieldPath}
    >
      <div className="overflow-hidden rounded-lg">
        <img
          src={course.imageUrl}
          alt={translate(course.title)}
          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
          data-nlv-field-path={`${baseFieldPath}.imageUrl`}
        />
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-lg text-stone-800" data-nlv-field-path={`${baseFieldPath}.title.en`}>{translate(course.title)}</h3>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xl font-bold text-stone-900" data-nlv-field-path={`${baseFieldPath}.price`}>${course.price.toFixed(2)}</p>
          <a
            href={course.enrollLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-stone-900 text-white text-sm font-semibold rounded-md hover:bg-stone-700 transition-colors"
            data-nlv-field-path={`${baseFieldPath}.enrollLink`}
          >
            <span data-nlv-field-path="translations.en.academy.enrollNow">{t('academy.enrollNow')}</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;