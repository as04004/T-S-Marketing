import React from 'react';
import { Mail, Facebook, Phone, MessageSquare, ExternalLink, Award, Code, Briefcase, Languages, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './App';
import { cn } from './lib/utils';

export const AboutMe = () => {
  const [localLang, setLocalLang] = React.useState<'en' | 'bn'>('en');
  const navigate = useNavigate();

  const content = {
    en: {
      title: 'Md. Rabbi',
      subtitle: 'Banking Solutions & Software Development',
      greeting: 'Assalamu Alaikum',
      intro: 'I am Md. Rabbi, currently working at Al-Arafah Islami Bank PLC, SPS Bazar Outlet. Alongside my professional role, I focus on developing custom software solutions related to banking and finance.',
      p1: 'With real-life banking experience and practical knowledge, I focus on building systems that are simple, accurate, and highly effective for daily operations.',
      p2: 'This application has been specially developed to simplify accounting and management for agent outlets. Manual record-keeping often leads to errors and makes remote monitoring difficult.',
      p3: 'To solve these challenges, this system enables agents and business owners to easily manage and monitor their outlet operations from anywhere.',
      listTitle: 'With this application, you can:',
      list: [
        'Maintain accounts quickly and accurately',
        'Track daily transactions with ease',
        'Access reports anytime',
        'Reduce manual errors',
        'Maintain full control over your business'
      ],
      featuresTitle: '🔹 Key Features',
      features: [
        'Daily transaction tracking',
        'Automated calculations and reporting',
        'Income and expense tracking',
        'Simple and user-friendly interface'
      ],
      suitableTitle: '🔹 Suitable For',
      suitableList: [
        'Agent banking outlets',
        'Cooperative societies',
        'Microfinance institutions',
        'Outlet-based businesses'
      ],
      contactTitle: '📞 Contact Me',
      footerTitle: '🔹 Need a customized software solution?',
      footerText: 'If you need a customized system for your organization, feel free to contact me. I can build a complete solution based on your requirements.',
      talk: "Let's Talk!",
      close: "Close"
    },
    bn: {
      title: 'মো: রাব্বি',
      subtitle: 'ব্যাংকিং সলিউশন ও সফটওয়্যার ডেভেলপমেন্ট',
      greeting: 'আসসালামু আলাইকুম',
      intro: 'আমি মো: রাব্বি। আমি বর্তমানে আল-আরাফাহ ইসলামী ব্যাংক পিএলসি, এসপিএস বাজার আউটলেটে কর্মরত আছি। আমার পেশাগত ভূমিকার পাশাপাশি, আমি ব্যাংকিং এবং অর্থ সংক্রান্ত কাস্টম সফটওয়্যার সমাধান তৈরির কাজ করি।',
      p1: 'বাস্তব জীবনের ব্যাংকিং কার্যক্রম এবং প্রত্যক্ষ অভিজ্ঞতার উপর ভিত্তি করে, আমি এমন ডিজিটাল সিস্টেম তৈরির দিকে মনোনিবেশ করি যা সহজ, নির্ভুল এবং দৈনন্দিন ব্যবহারের জন্য অত্যন্ত কার্যকর।',
      p2: 'এই অ্যাপ্লিকেশনটি বিশেষভাবে এজেন্ট আউটলেটগুলোর জন্য হিসাবরক্ষণ এবং ব্যবস্থাপনা সহজ করার জন্য তৈরি করা হয়েছে। ম্যানুয়ালি রেকর্ড রাখা প্রায়শই ত্রুটির দিকে পরিচালিত করে এবং দূরবর্তী পর্যবেক্ষণ করা কঠিন করে তোলে।',
      p3: 'এই চ্যালেঞ্জগুলো সমাধান করার জন্য, এই সিস্টেমটি এজেন্ট এবং ব্যবসার মালিকদের যে কোনো জায়গা থেকে সহজেই তাদের আউটলেটের কার্যক্রম পরিচালনা এবং তদারকি করতে দেয়।',
      listTitle: 'এই অ্যাপ্লিকেশনের মাধ্যমে আপনি যা করতে পারবেন:',
      list: [
        'দ্রুত এবং নির্ভুলভাবে হিসাব রাখা',
        'সহজে দৈনন্দিন লেনদেন ট্র্যাক করা',
        'যেকোনো সময় রিপোর্ট দেখা',
        'ম্যানুয়াল ত্রুটি কমানো',
        'আপনার ব্যবসার উপর পূর্ণ নিয়ন্ত্রণ রাখা'
      ],
      featuresTitle: '🔹 প্রধান বৈশিষ্ট্যসমূহ:',
      features: [
        'দৈনন্দিন লেনদেন ট্র্যাকিং',
        'স্বয়ংক্রিয় গণনা এবং রিপোর্টিং',
        'আয় এবং ব্যয় ট্র্যাকিং',
        'সহজ এবং ব্যবহারকারী-বান্ধব ইন্টারফেস'
      ],
      suitableTitle: '🔹 যাদের জন্য উপযোগী:',
      suitableList: [
        'এজেন্ট ব্যাংকিং আউটলেট',
        'সমবায় সমিতি',
        'ক্ষুদ্রঋণ প্রতিষ্ঠান',
        'আউটলেট-ভিত্তিক ব্যবসা'
      ],
      contactTitle: '📞 আমার সাথে যোগাযোগ করুন',
      footerTitle: '🔹 আপনার কি একটি কাস্টমাইজড সফটওয়্যার সমাধান প্রয়োজন?',
      footerText: 'আপনার প্রতিষ্ঠানের জন্য যদি একটি কাস্টমাইজড সিস্টেমের প্রয়োজন হয়, তবে নির্দ্বিধায় আমার সাথে যোগাযোগ করুন। আমি আপনার প্রয়োজনীয়তা অনুযায়ী একটি সম্পূর্ণ সমাধান তৈরি করে দিতে পারি।',
      talk: 'কথা বলা যাক!',
      close: "বন্ধ করুন"
    }
  };

  const currentContent = content[localLang];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: <Facebook className="w-6 h-6" />,
      url: 'https://www.facebook.com/mohammad.rabbi.944',
      color: 'bg-[#1877F2]'
    },
    {
      name: 'WhatsApp',
      icon: <MessageSquare className="w-6 h-6" />,
      url: 'https://wa.me/8801300594522',
      color: 'bg-[#25D366]'
    },
    {
      name: 'Email',
      icon: <Mail className="w-6 h-6" />,
      url: 'mailto:mdrabbi.career@gmail.com',
      color: 'bg-[#EA4335]'
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto space-y-8 pb-20 ${localLang === 'bn' ? 'font-bengali' : ''}`}>
      {/* Language Toggle */}
      <div className="flex justify-end pr-4">
        <button 
          onClick={() => setLocalLang(localLang === 'en' ? 'bn' : 'en')}
          className="p-3 bg-white rounded-full shadow-md border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 hover:scale-110 active:scale-95 group relative"
        >
          <Languages size={24} className={`${localLang === 'bn' ? 'text-emerald-600' : 'text-blue-600'}`} />
          {/* Tooltip on the side (left) */}
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 shadow-xl border border-slate-700 font-bold translate-x-2 group-hover:translate-x-0">
            {localLang === 'en' ? 'বাংলা' : 'English'}
          </div>
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 opacity-90" />
        <div className="px-8 pb-8 flex flex-col items-center -mt-32 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-white rounded-[4rem] scale-105 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="https://i.ibb.co.com/tpNwVRyf/file-00000000be4471fab7cf4a3050215650.png" 
              alt="Md. Rabbi" 
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="w-64 h-64 rounded-[4rem] object-contain bg-white border-4 border-white shadow-2xl relative z-10 transform-gpu"
            />
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 gradient-text inline-block tracking-tight">{currentContent.title}</h1>
            <p className="text-slate-500 font-bold mt-1 text-lg">{currentContent.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Award className="text-emerald-600 shrink-0" />
              {currentContent.greeting}
            </h3>
            <div className="space-y-4 text-slate-600 font-medium leading-[1.8] text-justify [hyphens:auto] [text-justify:inter-word] break-words">
              <p>{currentContent.intro}</p>
              <p>{currentContent.p1}</p>
              <p>{currentContent.p2}</p>
              <p>{currentContent.p3}</p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 space-y-6 text-emerald-900">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Briefcase className="text-emerald-700 shrink-0" />
              {currentContent.listTitle}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentContent.list.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold leading-snug">
                  <div className="mt-1 text-emerald-600 font-black shrink-0">•</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contact Icons - Simplified to just icons */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-800 text-center">{currentContent.contactTitle}</h3>
            <div className="flex justify-center gap-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link.color} text-white p-4 rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-95 group relative`}
                  title={link.name}
                >
                  {link.icon}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {link.name}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Code className="text-blue-600 shrink-0" />
              {currentContent.featuresTitle}
            </h3>
            <div className="space-y-3">
              {currentContent.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="text-emerald-600 shrink-0">✔</div>
                  <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100 space-y-4">
            <h3 className="text-lg font-black text-indigo-900 leading-tight">
              {currentContent.suitableTitle}
            </h3>
            <div className="space-y-2">
              {currentContent.suitableList.map((item, i) => (
                <div key={i} className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                  <div className="text-indigo-400 font-black">•</div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center text-white space-y-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <h3 className="text-2xl font-black tracking-tight">{currentContent.footerTitle}</h3>
        <p className="opacity-80 font-medium max-w-2xl mx-auto text-base leading-relaxed text-justify [hyphens:auto] [text-justify:inter-word] break-words md:text-center md:text-justify">
          {currentContent.footerText}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.open('https://wa.me/8801300594522', '_blank')}
            className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3 justify-center"
          >
            <MessageSquare size={24} />
            {currentContent.talk}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-lg hover:bg-white/20 transition-all active:scale-95 flex items-center gap-3 justify-center"
          >
            <X size={24} />
            {currentContent.close}
          </button>
        </div>
      </div>
    </div>
  );
};
