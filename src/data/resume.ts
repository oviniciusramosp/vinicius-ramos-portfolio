export const resume = {
  name: 'Vinicius Ramos',
  role: 'Senior Product Designer and Manager',
  location: 'Based in Florianópolis - SC, Brazil',
  intro: [
    "I'm a design graduate with 14 years of experience working with digital products. I specialize in UX, wireframing, prototyping, and creating high-fidelity mockups for web and mobile platforms.",
    "I engage in all stages of product development, from strategic concepts to final implementation. I've led design teams and worked effectively as both a team member and individual contributor.",
    // Paragraph with inline HP case link (matches live Framer)
    {
      before: 'My entrepreneurial and content creation background has enhanced my leadership and communication skills, demonstrated through my work with industry leaders like Intermex, ',
      link: { href: '/projects/hp-printables', label: 'HP' },
      after: ", Toyota's Raymond Corp, Gilbarco Veeder-Root, and Datafaction.",
    },
    'In summary, my technical expertise and proven experience as a designer and leader equip me to provide effective solutions for any company.',
  ],
  experience: [
    {
      periodStart: 'Nov 2024 -',
      periodEnd: 'Present',
      title: 'Senior Product Designer @ eVisit (USA)',
      body: 'eVisit is an enterprise virtual care platform that helps U.S. health systems, clinics, and government programs rearchitect how care is delivered, unifying patients, providers, and care teams across telemedicine use cases such as virtual visits, urgent care, and tele-consult. I design product experiences for patients and providers as well as internal tools that support clinical and operational workflows. I am one of the design leaders introducing AI-powered workstreams across the company and contributing to the rollout of AI features in the product suite.',
    },
    {
      periodStart: 'Jul 2021 -',
      periodEnd: 'Nov 2024',
      title: 'Senior Product Designer and Manager @ Staircase (USA)',
      body: 'Staircase is an American startup creating APIs for the Mortgage industry. I am responsible for applying agile methodologies, user experience mapping, designing user interfaces, developing product roadmaps, and feature prioritization. I work closely with engineering teams and business leaders to translate customer needs into beautiful, customer-focused solutions. Notably, I was part of the team that launched all B2C products, including innovative AI-driven solutions such as Chat MTG.',
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
      title: 'Lead Designer @ DConsumer (Brazil)',
      body: 'DConsumer was a startup developed through an accelerator program, focused on creating a BI dashboard for the pharmaceutical industry. This product managed inventory and orders placed by pharmacies and distributors. As the lead designer, I spearheaded the design for both mobile and desktop BI dashboard products, ensuring a seamless user experience across platforms.',
    },
    {
      periodStart: 'Jul 2017 -',
      periodEnd: 'Aug 2018',
      title: 'Co-founder and Lead Designer @ HeyLabs (Brazil)',
      body: "HeyLabs was created to meet the needs of MáximaTech, the leading technology company for large Brazilian industries and distributors, following the acquisition of HeyCheff. As the Lead Designer, I collaborated on the creation of MáximaTech's unique Design System and designed its first e-commerce app and website. Additionally, I developed the connected login system, enabling clients to access all their products from a single platform.",
    },
    {
      periodStart: 'Jul 2017 -',
      periodEnd: 'Aug 2018',
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
      'UI & UX Design',
      'AI',
      'Design Systems',
      'Accessibility (A11y)',
    ],
    other: [
      'Front-end Development',
      'Video Production & Editing',
      'Marketing & Social Media',
      'Illustration',
      'AR & VR',
    ],
  },
  education: [
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
} as const;

export type ResumeIntroBlock =
  | string
  | {
      before: string;
      link: { href: string; label: string };
      after: string;
    };
