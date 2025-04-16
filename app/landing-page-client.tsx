'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { VideoModal } from '@/components/VideoModal';
import { User } from '@supabase/supabase-js';

// Investigation workflow steps for the UI
const investigationSteps = [
  {
    title: 'Examine Evidence',
    description: 'Study crime scene photos and physical evidence',
  },
  {
    title: 'Interview Witnesses',
    description: 'Question witnesses and suspects to gather information',
  },
  {
    title: 'Analyze Clues',
    description: 'Connect the dots between evidence and testimonies',
  },
  {
    title: 'Solve the Case',
    description: 'Present your findings and identify the culprit',
  },
];

// Sections for the landing page
const investigationSections = [
  {
    id: 'overview',
    title: 'Overview',
    description:
      'Immersive detective experiences that challenge your deductive skills',
    bgClass: 'bg-background',
  },
  {
    id: 'cases',
    title: 'Detective Cases',
    description:
      'Solve mysteries ranging from art thefts to complex murder investigations',
    bgClass: 'bg-muted',
    metrics: [
      { label: 'Total Cases', value: '15+' },
      { label: 'Difficulty Levels', value: '3' },
      { label: 'Solve Rate', value: '62%' },
    ],
  },
  {
    id: 'evidence',
    title: 'Evidence Analysis',
    description:
      'Examine documents, crime scene photos, and digital communications',
    bgClass: 'bg-background',
    metrics: [
      { label: 'Evidence Types', value: '20+' },
      { label: 'Digital Tools', value: '5' },
      { label: 'Success Rate', value: '78%' },
    ],
  },
  {
    id: 'profiles',
    title: 'Suspect Profiles',
    description:
      'Study detailed backgrounds and psychological profiles of potential culprits',
    bgClass: 'bg-muted',
    metrics: [
      { label: 'Suspect Details', value: 'Comprehensive' },
      { label: 'Interrogations', value: 'Interactive' },
      { label: 'Red Herrings', value: 'Deceptive' },
    ],
  },
  {
    id: 'community',
    title: 'Detective Community',
    description:
      'Compare your detective skills with other investigators worldwide',
    bgClass: 'bg-background',
    metrics: [
      { label: 'Global Ranking', value: 'Live' },
      { label: 'Detective Badges', value: '12' },
      { label: 'Case Discussions', value: 'Forums' },
    ],
  },
];

export default function LandingPageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const router = useRouter();

  // Supabase user fetch and auth state change
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };

    fetchUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xs border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 overflow-x-auto hide-scrollbar">
            {investigationSections.map((section, index) => (
              <ScrollLink
                key={section.id}
                to={section.id}
                spy={true}
                smooth={true}
                offset={-100}
                duration={500}
                onSetActive={() => setActiveSection(section.id)}
                className={`flex items-center cursor-pointer group min-w-fit mx-4 first:ml-0 last:mr-0`}
              >
                <div className="relative">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 transition-all duration-300
                      ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                      }`}
                  >
                    {index + 1}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 hidden md:block whitespace-nowrap
                    ${
                      activeSection === section.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-primary'
                    }`}
                >
                  {section.title}
                </span>
              </ScrollLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Overview */}
      <div id="overview" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-20 pb-16 sm:pb-24">
            {/* Header Content */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                <span className="block">Solve Mysteries Like a</span>
                <span className="block text-primary">
                  Professional Detective
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                Immerse yourself in intriguing cases, analyze evidence, interview suspects, and put your deductive skills to the test.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Watch Demo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    isLoading
                      ? undefined
                      : user
                      ? router.push('/dashboard')
                      : router.push('/login')
                  }
                  className="px-8 py-3 bg-card hover:bg-muted text-primary border-2 border-primary rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading
                    ? 'Loading...'
                    : user
                    ? 'My Cases'
                    : 'Start Investigating'}
                </motion.button>
              </div>
            </div>

            {/* Combined Preview: Investigation Experience */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Case Preview */}
              <div className="relative">
                <pre className="relative rounded-xl bg-slate-900 p-8 shadow-2xl">
                  <code className="text-sm sm:text-base text-slate-100">
                    {`// The Missing Artifact Case File
CASE #001

LOCATION: City Museum
DATE: April 10, 2025
STATUS: OPEN

EVIDENCE COLLECTED:
- Security footage (8:15pm-8:45pm)
- Fingerprints on display case
- Staff access logs
- Anonymous tip received

WITNESSES:
- Night security guard
- Museum curator
- Cleaning staff

NOTES: Valuable artifact disappeared 
during regular hours. No signs of 
forced entry. Alarm was disabled.`}
                  </code>
                </pre>
              </div>

              {/* Investigation Steps */}
              <div className="grid grid-cols-1 gap-4">
                {investigationSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 1, y: 0 }}
                    className="relative p-4 bg-card/5 backdrop-blur-xs rounded-xl shadow-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="ml-8">
                      <h3 className="font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other sections */}
      {investigationSections.slice(1).map((section) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={`py-20 ${section.bgClass}`}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          onViewportEnter={() => setActiveSection(section.id)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                {section.title}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {section.description}
              </p>
            </div>

            {/* Clean Metrics Display */}
            {section.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {section.metrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/5 backdrop-blur-xs rounded-xl p-6 border border-border"
                  >
                    <div className="text-3xl font-bold text-primary mb-2">
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      ))}

      {/* Enhanced CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="relative py-20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-card rounded-xl shadow-xl p-12 border border-border">
            <div className="text-center">
              <motion.h2
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                className="text-3xl font-bold text-foreground"
              >
                Ready to Become a Detective?

              </motion.h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start solving mysteries and putting your detective skills to the test
              </p>

              <div className="mt-10 flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Watch Demo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    isLoading
                      ? undefined
                      : user
                      ? router.push('/dashboard')
                      : router.push('/login')
                  }
                  className="px-8 py-3 bg-card hover:bg-muted text-primary border-2 border-primary rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading
                    ? 'Loading...'
                    : user
                    ? 'View My Cases'
                    : 'Start Investigating'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="S1cnQG0-LP4"
      />
    </div>
  );
}