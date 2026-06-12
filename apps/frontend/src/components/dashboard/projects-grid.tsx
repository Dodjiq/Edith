'use client';

import { motion } from 'motion/react';
import { ProjectCard } from '@/components/dashboard/project-card';
import type { Project } from '@/types/database';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

type ProjectsGridProps = {
  projects: Project[];
};

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects }) => {
  return (
    <motion.div
      className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {projects.map((project) => (
        <motion.div key={project.id} variants={itemVariants}>
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export { ProjectsGrid };
