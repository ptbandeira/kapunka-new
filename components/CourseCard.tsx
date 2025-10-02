
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  index: number;
  fieldPath?: string;
  ['data-sb-field-path']?: string;
}

const CourseCard: React.FC<CourseCardProps> = (props) => {
  const { course, index, fieldPath } = props;
  const dataSbFieldPath = props['data-sb-field-path'];
  const { translate, t, language } = useLanguage();
  const baseFieldPath = `courses.courses.${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
      {...getVisualEditorAttributes(fieldPath ?? baseFieldPath)}
      data-sb-field-path={dataSbFieldPath ?? fieldPath ?? baseFieldPath}
    >
      <div className="overflow-hidden rounded-lg">
        <img
          src={course.imageUrl}
          alt={translate(course.title)}
          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
          {...getVisualEditorAttributes(`${fieldPath ?? baseFieldPath}.imageUrl`)}
          data-sb-field-path={`${fieldPath ?? baseFieldPath}.imageUrl`}
        />
      </div>
      <div className="mt-4">
        <h3
          className="font-semibold text-lg text-stone-800"
          {...getVisualEditorAttributes(`${fieldPath ?? baseFieldPath}.title.${language}`)}
          data-sb-field-path={`${fieldPath ?? baseFieldPath}.title.${language}`}
        >
          {translate(course.title)}
        </h3>
        <div className="flex items-center justify-between mt-4">
          <p
            className="text-xl font-bold text-stone-900"
            {...getVisualEditorAttributes(`${fieldPath ?? baseFieldPath}.price`)}
            data-sb-field-path={`${fieldPath ?? baseFieldPath}.price`}
          >
            ${course.price.toFixed(2)}
          </p>
          <a
            href={course.enrollLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-stone-900 text-white text-sm font-semibold rounded-md hover:bg-stone-700 transition-colors"
            {...getVisualEditorAttributes(`${fieldPath ?? baseFieldPath}.enrollLink`)}
            data-sb-field-path={`${fieldPath ?? baseFieldPath}.enrollLink`}
          >
            <span
              {...getVisualEditorAttributes(`translations.${language}.academy.enrollNow`)}
              data-sb-field-path={`translations.${language}.academy.enrollNow`}
            >
              {t('academy.enrollNow')}
            </span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
