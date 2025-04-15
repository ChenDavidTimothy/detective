"use client";

import { useAuth } from '@/contexts/AuthContext';
import { PricingSection } from '@/components/PricingSection';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { FaReddit } from 'react-icons/fa';
import { 
  FaGithub, 
  FaDiscord, 
  FaProductHunt,
  FaXTwitter,
  FaHackerNews,
  FaInstagram,
  FaTiktok,
  FaYoutube
} from 'react-icons/fa6';
import { 
 Lock, CreditCard, Moon
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { VideoModal } from '@/components/VideoModal';
import { useTheme } from '@/contexts/ThemeContext';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Update workflowSteps to be more generic
const workflowSteps = [
  {
    title: "Step One",
    description: "First step of your workflow",
    preview: <TypewriterEffect text="Processing step one..." />
  },
  {
    title: "Step Two",
    description: "Second step of your workflow",
    preview: <TypewriterEffect text="Executing step two..." />
  },
  {
    title: "Step Three",
    description: "Third step of your workflow",
    preview: <TypewriterEffect text="Running step three..." />
  },
  {
    title: "Step Four",
    description: "Fourth step of your workflow",
    preview: <TypewriterEffect text="Completing step four..." />
  }
];

// Update platforms to be generic
const platforms = [
  { name: 'Platform 1', icon: FaGithub },
  { name: 'Platform 2', icon: FaDiscord },
  { name: 'Platform 3', icon: FaReddit },
  { name: 'Platform 4', icon: FaProductHunt },
  { name: 'Platform 5', icon: FaXTwitter },
  { name: 'Platform 6', icon: FaHackerNews },
  { name: 'Platform 7', icon: FaInstagram },
  { name: 'Platform 8', icon: FaTiktok },
  { name: 'Platform 9', icon: FaYoutube }
];

// Update workflowSections to be generic with shadcn theming system
const workflowSections = [
  {
    id: "overview",
    title: "Overview",
    description: "Everything you need to build modern SaaS applications",
    bgClass: "bg-background"
  },
  {
    id: "authentication",
    title: "Authentication",
    description: "Secure user authentication with multiple providers",
    bgClass: "bg-muted",
    metrics: [
      { label: "Auth Providers", value: "5+" },
      { label: "Setup Time", value: "2min" },
      { label: "Security", value: "A+" }
    ]
  },
  {
    id: "payments",
    title: "Payments",
    description: "Seamless payment integration with Stripe",
    bgClass: "bg-background",
    metrics: [
      { label: "Integration", value: "1-Click" },
      { label: "Providers", value: "Stripe" },
      { label: "Setup Time", value: "5min" }
    ]
  },
  {
    id: "database",
    title: "Database",
    description: "Powerful database with Supabase integration",
    bgClass: "bg-muted",
    metrics: [
      { label: "Database", value: "PostgreSQL" },
      { label: "Real-time", value: "Yes" },
      { label: "Security", value: "RLS" }
    ]
  },
  {
    id: "features",
    title: "Features",
    description: "Additional features to enhance your application",
    bgClass: "bg-background",
    metrics: [
      { label: "Dark Mode", value: "Built-in" },
      { label: "Components", value: "50+" },
      { label: "TypeScript", value: "100%" }
    ]
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Simple, transparent pricing for your needs",
    bgClass: "bg-muted"
  }
];

// Custom Hook to create section progress values
function useSectionProgressValues(numSections: number) {
  const { scrollYProgress } = useScroll();
  
  // Create all transforms at once, at the top level
  const section1Progress = useTransform(
    scrollYProgress,
    [0 / numSections, 1 / numSections],
    [0, 1]
  );
  const section2Progress = useTransform(
    scrollYProgress,
    [1 / numSections, 2 / numSections],
    [0, 1]
  );
  const section3Progress = useTransform(
    scrollYProgress,
    [2 / numSections, 3 / numSections],
    [0, 1]
  );
  const section4Progress = useTransform(
    scrollYProgress,
    [3 / numSections, 4 / numSections],
    [0, 1]
  );

  return [section1Progress, section2Progress, section3Progress, section4Progress];
}

// Feature cards data
const featureCards = [
  {
    title: "Authentication",
    description: "Supabase auth with social providers",
    icon: <Lock className="h-6 w-6 text-primary" />,
    bgGradient: "from-blue-500/10 to-purple-500/10"
  },
  {
    title: "Payments",
    description: "Stripe subscription management",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  {
    title: "Dark Mode",
    description: "Built-in theme management",
    icon: <Moon className="h-6 w-6 text-primary" />,
    bgGradient: "from-orange-500/10 to-red-500/10"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const { isInTrial } = useTrialStatus();
  const [activeSection, setActiveSection] = useState("overview");
  const sectionProgressValues = useSectionProgressValues(workflowSections.length);
  const { theme } = useTheme();
  
  const router = useRouter();

  const [dashboardRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const { scrollYProgress } = useScroll();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Enhanced Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xs border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 overflow-x-auto hide-scrollbar">
            {workflowSections.map((section, index) => (
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
                      ${activeSection === section.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}
                  >
                    {index + 1}
                  </span>
                </div>
                <span 
                  className={`text-sm font-medium transition-colors duration-300 hidden md:block whitespace-nowrap
                    ${activeSection === section.id 
                    ? 'text-primary' 
                    : 'text-muted-foreground group-hover:text-primary'}`}
                >
                  {section.title}
                </span>
              </ScrollLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Now acts as Overview */}
      <div id="overview" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-accent/10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-20 pb-16 sm:pb-24">
            {/* Header Content */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                <span className="block">Next.js + Stripe + Supabase</span>
                <span className="block text-primary">Production-Ready Template</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                Start building with authentication and payments in minutes.
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
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="px-8 py-3 bg-card hover:bg-muted text-primary border-2 border-primary rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Start Free Trial
                </button>
              </div>
            </div>

            {/* Combined Preview: Code + Workflow Steps */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Code Preview */}
              <div className="relative">
                <pre className="relative rounded-xl bg-slate-900 p-8 shadow-2xl">
                  <code className="text-sm sm:text-base text-slate-100">
                    <TypewriterEffect text={`// 🚀 The Ultimate Dev Setup
import { useCoffee, useCode } from '@/hooks/dev';

export const DevLife = () => {
  const { coffee } = useCoffee();
  const { bugs } = useCode();
  
  return (
    <div className="dev-life">
      <Status>
        {coffee ? '⚡️ Coding Mode' : '😴 Need Coffee'}
        {bugs === 0 ? '🎉 No Bugs!' : '🐛 Debug Time'}
      </Status>
    </div>
  );`} />
                  </code>
                </pre>
              </div>

              {/* Workflow Steps */}
              <div className="grid grid-cols-1 gap-4">
                {workflowSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 1, y: 0 }}
                    className="relative p-4 bg-card/5 backdrop-blur-xs rounded-xl shadow-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="ml-8">
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other sections */}
      {workflowSections.slice(1).map((section, index) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={`py-20 ${section.bgClass}`}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
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

            {/* Pricing Section */}
            {section.id === "pricing" && <PricingSection />}
          </div>
        </motion.section>
      ))}

      {/* Enhanced CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="relative py-20"
      >
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-card rounded-xl shadow-xl p-12 border border-border">
            <div className="text-center">
              <motion.h2 
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                className="text-3xl font-bold text-foreground"
              >
                Ready to Get Started?
              </motion.h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start using our product today
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
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-card hover:bg-muted text-primary border-2 border-primary rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Start Free Trial
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