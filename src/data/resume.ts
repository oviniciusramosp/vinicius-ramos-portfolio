/**
 * Resume content — aligned to the designed A4 PDF (Resume.pdf reference):
 * name · role|intro · experience · skills|education · Reach Me Out.
 * Screen page reuses the same data; print CSS handles paper layout.
 */
export const resume = {
  name: 'Vinicius Ramos',
  /** PDF shows title without “and Manager”; keep full title for web + PDF. */
  role: 'Senior Product Designer',
  location: 'Based in Florianópolis - SC, Brazil',
  intro: [
    "I'm a design graduate who has been working with digital products for the past 14 years. I have extensive experience in UX, wireframing, prototyping, and creating high-fidelity mockups for both web and mobile.",
    'I usually get involved in all product development stages: from the initial strategic concepts to the final implementation. I have been a design lead on project teams and worked equally well as part of a team or individual contributor.',
    // HP stays linked on the web; print styles make it plain black underline.
    {
      before:
        'My experience as an entrepreneur and content creator allowed me to lead and communicate well with my co-workers. I had the chance to show that mainly during the last months when I worked for market leaders like Intermex, ',
      link: { href: '/projects/hp-printables', label: 'HP' },
      after:
        ", Toyota's Raymond Corp, Gilbarco Veeder-Root, and Datafaction (City National Bank's Fintech SaaS company).",
    },
    'In summary, I trust my technical knowledge and proven experience as a designer and leader to provide solutions for any company.',
  ],
  experience: [
    {
      periodStart: 'Nov 2024 -',
      periodEnd: 'Now',
      title: 'Senior Product Designer @ eVisit (USA)',
      body: 'eVisit is an enterprise virtual care platform that helps U.S. health systems, clinics, and government programs rearchitect how care is delivered, unifying patients, providers, and care teams across telemedicine use cases such as virtual visits, urgent care, and tele-consult. I design product experiences for patients and providers as well as internal tools that support clinical and operational workflows. I am one of the design leaders introducing AI-powered workstreams across the company and contributing to the rollout of AI features in the product suite.',
    },
    {
      periodStart: 'Jul 2021 -',
      periodEnd: 'Nov 2024',
      title: 'Lead Design and Product Manager @ Staircase (USA)',
      body: 'Staircase is an American startup creating APIs for the Mortgage industry. I am responsible for applying agile methodologies, user experience mapping, designing user interfaces, developing product roadmaps, and feature prioritization. I work closely with engineering teams and business leaders to translate customer needs into beautiful, customer-focused solutions. Notably, I was part of the team that launched all B2C products, including innovative AI-driven solutions such as ChatMTG.',
    },
    {
      periodStart: 'Mar 2020 -',
      periodEnd: 'Apr 2021',
      title: 'Product Designer @ ArcTouch (Brazil and USA)',
      body: "As a product designer at ArcTouch, I collaborated with product teams to create wireframes, user flows, mock-ups, and prototypes. I led product design for Intermex and worked with notable clients such as HP, Gilbarco Veeder-Root, and Toyota's Raymond Corp. I also helped Datafaction, a City National Bank's Fintech SaaS company, with the UI and UX for their first mobile app. Additionally, I conducted design workshops and led the development of the first accessible apps at ArcTouch.",
    },
    {
      periodStart: 'Aug 2018 -',
      periodEnd: 'Jun 2019',
      title: 'Lead Design @ DConsumer (Brazil)',
      body: 'DConsumer was a startup developed through an accelerator program, focused on creating a BI dashboard for the pharmaceutical industry. This product managed inventory and orders placed by pharmacies and distributors. As the lead designer, I spearheaded the design for both mobile and desktop BI dashboard products, ensuring a seamless user experience across platforms.',
    },
    {
      periodStart: 'Dec 2014 -',
      periodEnd: 'Jun 2017',
      title: 'Co-founder and Lead Designer @ HeyCheff (Brazil)',
      body: "As the co-founder of this startup, I wore many hats, including Product Designer, Front-end Developer, and Marketing lead. HeyCheff aimed to help clients schedule lunch orders, saving time and avoiding lines at their favorite restaurants. We developed an app to facilitate this, along with white-labeled apps and websites for restaurants. Additionally, we provided a comprehensive dashboard for clients to manage their operations seamlessly. The design process for the HeyCheff dashboard was also the subject of my bachelor's degree final project in Design at UFSC.",
    },
  ],
  skills: {
    main: [
      'Discovery Sessions & Workshops',
      'Wireframing',
      'Rapid Prototyping',
      'Interaction Design',
      'UI and UX',
      'Visual Design',
      'Design Systems',
      'A11y (Accessibility)',
    ],
    other: [
      'Front-end Development',
      'Video Production and Editing',
      'Marketing and Social Media',
      'Illustration',
      'AR and VR',
      'AI',
    ],
  },
  education: [
    {
      period: '2021 - now',
      school: 'UniBF',
      detail: 'Graduate Degree in Design Thinking',
    },
    {
      period: '2020 - 2021',
      school: 'Deque University',
      detail: 'Designing an Accessible User Experience Course',
    },
    {
      period: '2012 - 2017',
      school: 'Universidade Federal de Santa Catarina (UFSC)',
      detail: "Bachelor's Degree in Design",
    },
    {
      period: '2015 - 2016',
      school: 'State University of New York Cobleskill (SUNY)',
      detail: 'Fully Funded Scholarship Recipient',
    },
  ],
  /** Contact block — PDF “Reach Me Out” footer */
  contact: {
    email: {
      label: 'Email',
      value: 'oviniciusramos@gmail.com',
      href: 'mailto:oviniciusramos@gmail.com',
    },
    whatsapp: {
      label: 'WhatsApp',
      value: '+55 11 95145 6410',
      href: 'https://wa.me/5511951456410',
    },
    linkedin: {
      label: 'LinkedIn',
      value: '/oviniciusramos',
      href: 'https://www.linkedin.com/in/viniciusramos/',
    },
    portfolio: {
      label: 'Portfolio',
      value: 'viniciusramos.com',
      href: 'https://viniciusramos.com',
    },
  },
} as const;

export type ResumeIntroBlock =
  | string
  | {
      before: string;
      link: { href: string; label: string };
      after: string;
    };
