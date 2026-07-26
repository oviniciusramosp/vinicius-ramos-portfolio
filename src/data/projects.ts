export type ProjectSize = 'lg' | 'md' | 'sm' | 'tall' | 'wide';

export type ProjectSection = {
  title: string;
  paragraphs: string[];
  images?: string[];
};

export type ProjectQuote = {
  text: string;
  author: string;
  role: string;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  tags: string[];
  summary: string;
  cover: string;
  size: ProjectSize;
  href?: string;
  soon?: boolean;
  sections: ProjectSection[];
  quotes?: ProjectQuote[];
  nextSlug?: string;
  note?: string;
};

const FRAMER = 'https://framerusercontent.com/images';

export const projects: Project[] = [
  {
    slug: 'staircase',
    title: 'Staircase',
    year: '2023',
    tags: ['AI', 'WEB'],
    summary:
      'Led the design of key tools at Staircase, leveraging AI and advanced APIs to streamline the traditionally lengthy American mortgage process to less than 48 hours.',
    cover: `${FRAMER}/iVkogMvFCsOuQA0VY6Tr7Yrzpk.png?lossless=1&width=1800&height=1831`,
    size: 'lg',
    href: '/projects/staircase',
    nextSlug: 'hp-printables',
    sections: [
      {
        title: 'Role',
        paragraphs: [
          'I joined Staircase in 2021 as a Designer and also took on the role of Product Manager while developing internal tools. From 2023 onwards, I focused on the company’s B2B and B2C products.',
          'My role involved creating a process where components are generated from Figma without any code development, writing automated tests, and publishing functional applications. Key projects included ChatMTG, the Rate Calculator, the digital PreApproval Letter, and the Listings tool.',
        ],
      },
      {
        title: 'User Journey and Products',
        paragraphs: [
          'Users begin their journey with the Listings tool, a platform with a simplified, minimalist user experience similar to Airbnb. Here, they can browse properties, apply for PreApproval through ChatMTG, contact an agent, or schedule home visits.',
          'The Listings tool also uses AI to select the best photos, organize them, and generate standardized descriptions for properties. Staircase differentiates itself by offering lower rates through reduced intermediaries, thereby lowering costs.',
          'The Chat MTG serves as a mortgage-focused AI chatbot, similar to Chat GPT, where users can input their data, ask questions, and determine their loan eligibility. Traditionally, obtaining a pre-approval letter from a bank can take several days or weeks, but Chat MTG reduces this process to mere minutes.',
          'Once the user completes the Chat MTG process, they receive a PreApproval, which is a digital version of traditional pre-approval letters. This digital format is not only more convenient but also promotes Staircase, as users can easily share it with others involved in their mortgage process.',
          'During Open Houses, visitors use the Rate Calculator to sign up and calculate their mortgage rates on the spot. This tool helps users quickly check their eligibility and see potential rates, enhancing their experience and engagement with the Staircase platform.',
        ],
      },
      {
        title: 'Challenges and Impact',
        paragraphs: [
          'Collaborating closely with the CEO and CTO, we set and achieved daily goals in a high-pressure environment. This required managing tight deadlines and adapting quickly to new information. Additionally, I worked with branding from an external company, which posed challenges in aligning with accessibility standards for digital interfaces. These experiences significantly enhanced my leadership skills, resilience, and ability to take on multiple roles, including Product Manager, Product Designer, test writer, and app developer.',
        ],
      },
    ],
    quotes: [
      {
        text: "Throughout our collaboration, Vini consistently demonstrated a deep understanding of user needs and a keen eye for detail. He approaches every project with enthusiasm and professionalism, and always goes above and beyond to deliver exceptional results. He brings fresh and innovative ideas to the table, while still adhering to project requirements and timelines.\n\nIn addition to his design skills, Vini also took on the role of project manager, and he excelled in this area. Despite it not being his primary role, Vini's project management skills were second to none in our company.",
        author: 'Guido Avogadro',
        role: 'Product Designer at Staircase',
      },
      {
        text: "Vini is one of the most dedicated professionals I’ve worked with and is always willing to put that extra help whenever you need it.\n\nHe has a keen eye for detail and as a manager he helped our team come up with quick solutions on complex features while balancing the workload.",
        author: 'Alonso Godinez',
        role: 'Software Engineer at Staircase',
      },
    ],
    note: 'Recently, the company updated its branding, including new colors and a redesigned logo. The design presented here remains the version I believe is most aligned with the company’s target audience.',
  },
  {
    slug: 'hp-printables',
    title: 'HP Printables',
    year: '2020',
    tags: ['WEB'],
    summary:
      'Redesigned the Print, Play & Learn website to create an engaging platform for printable content, allowing users to easily find and print materials such as games, coloring pages, holiday cards, children’s exercises, and more.',
    cover: `${FRAMER}/OHYUgJmxWxj1mumTybM6nJORSwg.png?lossless=1&width=764&height=819`,
    size: 'lg',
    href: '/projects/hp-printables',
    nextSlug: 'vibecheck',
    sections: [
      {
        title: 'Project Kickoff and Discovery',
        paragraphs: [
          'At the project’s inception, I had a call with HP’s Principal Designer to get acquainted and discuss the project vision, tools, stages, and timeline. Following this, we conducted several online workshops with other HP decision-makers to better understand the scope of functionalities, learnings from the product being replaced, requirements, target audience, and product expectations.',
          'I then developed wireframes, which were refined through several rounds of feedback between myself, Chad, and the company’s stakeholders. Once the wireframes were approved, I began working on the visual design.',
        ],
      },
      {
        title: 'Design Challenges',
        paragraphs: [
          'One of the main challenges was integrating the rigid and serious HP Design System into a fun and colorful platform. To achieve this, we added colorful overlay elements and played with CMYK colors within HP’s palette, ensuring a playful interface that remained consistent with the existing design system. We also used halftone dots to create textures and utilized the angle of the HP logo to rotate elements within the interface.',
          'The development process involved close collaboration with the HP team and frequent iterations to balance the project’s playful aspects with the constraints of the design system. By utilizing existing components, the platform was rapidly released, ensuring a seamless experience for HP users.',
        ],
      },
      {
        title: 'Final Deliverables',
        paragraphs: [
          'As part of the final deliverables, I created prototypes for mobile, tablets, and desktops. These prototypes were presented to HP stakeholders, approved, and handed over to the developers to facilitate understanding of the product’s functionalities, transitions, and interactions.',
          'Additionally, screens and prototypes representing phase 2 of the product were presented, including integration with HP+ (HP’s subscription and rewards system), a user sign-up system, and spaces for advertisements and promotions.',
        ],
      },
      {
        title: 'Results and Impact',
        paragraphs: [
          'The HP Printables platform was successfully launched, earning praise from HP executives and users. It seamlessly integrated with HP’s existing websites, respecting the design system and creating a user-friendly, engaging platform. The platform is still active and prominently featured on the main page of the HP printer app.',
          'Additionally, the project became a standout case study for ArcTouch.',
        ],
      },
    ],
    quotes: [
      {
        text: "I’ve had nothing but good interactions with Vini. He took time up front to make sure he understood the objectives, he took direction really well, didn’t have an ego about the designs, and was really quick to turn things around when needed. I would happily work with him again!",
        author: 'Chad Q. Martin',
        role: 'Principal Designer at HP',
      },
      {
        text: "Can’t express enough my gratitude to the work that you have done on this project. Developing the Netflix of printables! We wanted an improved customer experience, a solution that’s scalable and ready for the future. And you did it. Amazing job!",
        author: 'Stefan',
        role: 'Head of Software & Solution Marketing at HP',
      },
      {
        text: 'Congrats to the entire team who worked on this challenging product […] Special thanks to Martim Sisson and Alysson Lopes for their leadership on this project, along with Vinicius Ramos for his great design work - our first design work for any HP project ever. HP has high expectations for success of Printables and love the work we’ve done.',
        author: 'James Patriquin',
        role: 'VP of Client Services at ArcTouch',
      },
    ],
    note: 'Special thanks to Eduardo Tanaka for connecting me with this project through ArcTouch, and to Chad Martin for his invaluable guidance and productive conversations throughout the project.',
  },
  {
    slug: 'vibecheck',
    title: 'Vibecheck',
    year: '2021',
    tags: ['WEB', 'CONCEPT'],
    summary:
      'During a hackathon at AE Studio, the internal tool Vibecheck was created for AI sentiment analysis. As part of the hiring process, I redesigned Vibecheck, suggested improvements, and created user stories, leading to my employment at AE Studio.',
    cover: `${FRAMER}/RcO3ablF3ttKN5S5n2hEDr1uAk.png?lossless=1&width=2000&height=1367`,
    size: 'sm',
    href: '/projects/vibecheck',
    nextSlug: 'intermex',
    sections: [
      {
        title: 'Audit',
        paragraphs: [
          'The project began with an email from AE Studio asking me to review and redesign Vibecheck. It is a tool that uses AI to evaluate the sentiment of tweets. The email included a link to the existing Vibecheck app and a list of tasks, such as suggesting improvements for virality and creating feature ideas with designs or user stories.',
        ],
      },
      {
        title: 'Audit Notes',
        paragraphs: [
          'To understand the current state of Vibecheck, I conducted a thorough audit of the product. During this audit, I took extensive notes, balancing objective and subjective points. I checked the webpage on various devices and viewport sizes, ran Lighthouse diagnostics, and navigated using accessibility tools like VoiceOver, font scaling, and keyboard navigation. My audit also included annotating opportunities for improvement and posing questions about potential features, UI enhancements, performance issues, and ADA improvements.',
        ],
      },
      {
        title: 'Wireframing and Moodboard',
        paragraphs: [
          'With the user stories defined, I began exploring solutions. Ideally, I would rely on data to inform my decisions, but due to limited access and time constraints, I leveraged my experience and relevant references. I created hand-drawn wireframes to explore ideas and organize the information.',
          'For this challenge, I opted for a single mood board to expedite the process, incorporating elements from the original product like waves and square corners. I also used Twitter’s color palette and a monospaced font to emphasize the algorithm and AI concepts.',
        ],
      },
      {
        title: 'Final Deliverables',
        paragraphs: [
          'I designed the project’s interface based on my wireframes and mood board. For certain parts of the experience, I created multiple approaches to select the best alternative. Although it wasn’t part of the challenge requirement, I generated two prototypes to better illustrate my envisioned user experience. This practice helps developers understand my expectations for the final product, so I applied the same approach here.',
          'Additionally, I delivered a comprehensive presentation explaining my process, which included detailed explanations of my design decisions and user stories. These deliverables were crucial in demonstrating my approach and securing my position at AE Studio.',
        ],
      },
    ],
  },
  {
    slug: 'gilbarco',
    title: 'Gilbarco',
    year: '2020',
    tags: ['GAS PUMP OS', 'A11Y'],
    summary: 'Accessibility-focused work on the Gilbarco gas pump operating system.',
    cover: `${FRAMER}/fPPrfYc8utPH5PTgQv1X8WZxXU.png?lossless=1&width=1200&height=1395`,
    size: 'sm',
    soon: true,
    sections: [],
  },
  {
    slug: 'intermex',
    title: 'Intermex',
    year: '2021',
    tags: ['MOBILE', 'A11Y'],
    summary:
      'Led the design of the Intermex app, developed its design system, and ensured the app was fully accessible (a11y compliant), facilitating money transfers from the U.S. to Latin America and the Caribbean, focusing on users with limited tech knowledge.',
    cover: `${FRAMER}/KDJ8dI9G4pR5XgWWFsyJ5N6I8bs.png?width=1210&height=2060`,
    size: 'tall',
    href: '/projects/intermex',
    nextSlug: 'booking',
    sections: [
      {
        title: 'Project Kickoff and Discovery',
        paragraphs: [
          'The project began with several virtual workshop and discovery sessions to identify Intermex’s target audience: Latinos with limited tech knowledge who need to send money to their families in other countries, like Mexico.',
          'Intermex, as the leading processor of money transfer services in the U.S. to Latin America and the Caribbean, required a tailored approach to address the unique needs of this demographic.',
        ],
      },
      {
        title: 'Wireframing and Prioritization',
        paragraphs: [
          'We proceeded with wireframing and feature prioritization to outline the MVP. I led the wireframe creation with two other designers, iterating through several rounds of feedback with the Intermex team to refine the scope and ensure alignment with the company’s goals.',
        ],
      },
      {
        title: 'UI Exploration',
        paragraphs: [
          'In the UI phase, we explored concepts and created mood boards. We looked for visual representations of the feelings, concepts, and personas defined during discovery. Three mood boards were presented to the client. Intermex, launching a new brand with a vibrant green, chose the “So Green” concept. Though not our first choice, it aligned well with their new branding.',
          'Once the concept was decided, we implemented all other app screens with that visual language and created a simple design system for easy use.',
        ],
      },
      {
        title: 'Accessibility',
        paragraphs: [
          'Accessibility was a major focus for this project as many companies often overlook it in their apps. During the accessibility phase, I researched criteria and implementation methods, adjusting the design for contrast, Voice Over, Focus Order, and Font Scaling.',
          'To create an effective Voice Over experience, I collaborated with a blind user who demonstrated how he navigates apps daily. This experience was crucial in determining the content and element order for Voice Over.',
        ],
      },
    ],
    quotes: [
      {
        text: "I'm always impressed by Vini's professional posture on the project and all the work he put into it: from super organized and structured Figma files, to how he comes up with good ideas and solutions for the project, the way he presents and communicates them and how he is always trying to optimize the work to make it easier and faster! Working with him is very rewarding and enriching!",
        author: 'João Brizzi',
        role: 'Product Designer at ArcTouch',
      },
    ],
  },
  {
    slug: 'moove',
    title: 'Moove',
    year: '—',
    tags: ['BRAND'],
    summary: 'Brand design work for Moove.',
    cover: `${FRAMER}/288F11Mf2MRtONk3A1SH2NOA.svg?width=1844&height=1392`,
    size: 'wide',
    soon: true,
    sections: [],
  },
  {
    slug: 'bubble',
    title: 'Bubble',
    year: '—',
    tags: ['VISION PRO'],
    summary: 'Spatial computing concept for Bubble on Apple Vision Pro.',
    cover: `${FRAMER}/GYdQIKFo1opDQy8FHD7lExMvak.png?lossless=1&width=2000&height=1500`,
    size: 'lg',
    soon: true,
    sections: [],
  },
  {
    slug: 'booking',
    title: 'Booking.com',
    year: '2020',
    tags: ['MOBILE', 'CONCEPT'],
    summary:
      'Conducted a design critique and redesign concept of the Booking.com app’s search flow, focusing on enhancing usability and visual harmony by addressing inconsistencies and improving the overall user experience.',
    cover: `${FRAMER}/OBLjNMv2ereMgmyMWjWgMY2gX3s.png?width=1090&height=754`,
    size: 'wide',
    href: '/projects/booking',
    nextSlug: 'staircase',
    sections: [
      {
        title: 'Audit',
        paragraphs: [
          'I identified several key issues in the app, including a lack of design patterns, poor harmony among UI elements due to an inconsistent design system, and a confusing search experience where category changes resulted in loss of user input. Additionally, some areas lacked context, making it difficult for users to understand the content, and the search results pages were cluttered with low legibility.',
        ],
      },
      {
        title: 'Redesign Process',
        paragraphs: [
          'To address these issues, I turned to Airbnb and SkyScanner as primary visual references. Both apps have well-structured search flows with clear patterns that enhance usability. I used these references to guide the redesign, applying industry standards that users would find familiar.',
          'The main objective of my redesign was to create a clearer, more intuitive experience for the user, adhering to industry standards to make the flow more predictable. I focused on reorganizing the information, defining clear hierarchies, and eliminating unnecessary visual clutter.',
          'I developed a simple prototype in Figma, emphasizing the user interactions and transitions. This allowed for an easy comparison with the current Booking.com app, clearly demonstrating how the proposed changes would improve the user experience.',
        ],
      },
      {
        title: 'Challenges & Outcome',
        paragraphs: [
          'The most challenging part of this project was organizing the information effectively. Identifying groups, hierarchies, and essential data required careful consideration to ensure that the final design would be both functional and user-friendly.',
          'The success of this project led to an offer from Zygo for the position of Senior UI Designer. However, I decided to continue my career at ArcTouch, as I saw more promising opportunities for growth there.',
        ],
      },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getPublishedProjects() {
  return projects.filter((p) => p.href && !p.soon);
}

export function getHomeProjects() {
  return projects;
}
