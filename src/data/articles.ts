/**
 * Articles listed on /articles and served at /articles/[id].
 * Sourced from LinkedIn posts (activity IDs decode to post timestamps).
 * Card shows date · title · short description · image;
 * full copy lives on the article page (shareable URL).
 */

/** Inline project/highlight link inside article body copy */
export type ArticleHighlight = {
  text: string;
  href: string;
  tooltip: string;
};

/** Plain string, or mixed text + highlight links */
export type ArticleParagraph = string | Array<string | ArticleHighlight>;

/** Postscript / update after the original post (e.g. related video) */
export type ArticleNote = {
  /** Small eyebrow, e.g. "Addition" */
  label?: string;
  /** Body copy for the note */
  paragraphs: string[];
  /** YouTube watch URL or embed URL */
  youtubeUrl?: string;
};

export type Article = {
  /** URL slug: /articles/{id} */
  id: string;
  /** Display date on the gallery card (e.g. "Jun 2026") */
  date: string;
  title: string;
  /** Short blurb under the title on the card */
  description: string;
  image: string;
  imageAlt?: string;
  /**
   * CSS object-position for cropped/filled image containers
   * (gallery already pins feature art to bottom; article page defaults to center).
   * e.g. 'bottom center', 'center top'
   */
  imageObjectPosition?: string;
  /**
   * Scale the art inside its frame (1 = 100%). e.g. 0.8 for 80%.
   */
  imageScale?: number;
  /**
   * How the image fills its slot on the article page.
   * `cover` (default) crops to fill; `contain` shows the full image (fit).
   */
  imageFit?: 'cover' | 'contain';
  /** Full article body — each item is a paragraph (string or rich parts) */
  content: ArticleParagraph[];
  /** Original LinkedIn post URL */
  sourceUrl?: string;
  /** Optional addition after the post body */
  note?: ArticleNote;
};

/** Convert a YouTube watch/share URL into a privacy-friendly embed src. */
export function youtubeEmbedSrc(url: string): string | undefined {
  try {
    const u = new URL(url);
    let id = u.searchParams.get('v');
    if (!id && (u.hostname.includes('youtu.be') || u.pathname.startsWith('/embed/'))) {
      id = u.pathname.split('/').filter(Boolean).pop() ?? null;
    }
    if (!id) return undefined;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return undefined;
  }
}

export function isArticleHighlight(
  part: string | ArticleHighlight,
): part is ArticleHighlight {
  return typeof part === 'object' && part !== null && 'href' in part;
}

/** Absolute path for an article (shareable). */
export function articleHref(id: string): string {
  return `/articles/${id}`;
}

export const articles: Article[] = [
  {
    id: 'apple-ai-app-intents',
    date: 'Jun 2026',
    title: 'Siri, meet my app',
    description:
      'Notes from an exclusive Apple Brazil event: OS-level intelligence, App Intents, and a foldable prep hint.',
    image: '/articles/apple-ai-app-intents.png',
    imageAlt: 'iPhone Dynamic Island with a glass lens effect over the lock screen',
    imageObjectPosition: 'bottom center',
    sourceUrl:
      'https://www.linkedin.com/feed/update/urn:li:activity:7475653372675633152/',
    content: [
      [
        'Yesterday, I had the chance to visit Apple Brazil, invited by the company, to attend an exclusive event alongside developers from major apps and companies. The experience was incredible. Beyond the ',
        {
          text: 'recognition for my app',
          href: '/projects/crypto-bros',
          tooltip: 'View Project: Crypto Bros',
        },
        ', I left with some very interesting learnings about what Apple is preparing for iOS 27.',
      ],
      'Over the past few years, many of us have felt that Apple was falling behind in AI. Today, I see it differently. Apple is not trying to ship a model like Gemini, Claude, Grok, GLM, or anything similar. Apple is building intelligence at the operating system level.',
      'The closest comparison I can think of is OpenClaw, but with one major difference: OpenClaw needs to understand the context of your apps and websites in order to figure out what you want it to do. Apple’s new intelligence will receive that context from apps in a much more standardized way. Developers will have a simple way to expose to the system what their apps contain and what actions can be performed inside them. This happens through App Intents and App Entities.',
      'A simple way to think about it: Entities are the “things” inside your app, like an event, a post, an image, a card, a video, or a document. Intents are the actions people can take with those things, like schedule, read, edit, open, create, or share. It sounds basic, but it is a big shift.',
      'Anyone who has used tools like OpenClaw has probably experienced the frustration of having to explain, again and again, how to do something inside a specific app. With Apple’s approach, part of that instruction layer becomes the developer’s responsibility. The app tells the system what exists, what matters, and what can be done.',
      'In my last post, I wrote about the need for products and services to adapt not only for human users, but also for AI agents. That is exactly the direction Apple is pushing toward: a simple way for apps to become more understandable and actionable by system-level intelligence.',
      'One more thing: It also became clear to me that Apple is preparing the developer community for the foldable iPhone, especially by encouraging apps to support layouts that scale horizontally and render well on screens that are much closer to a square format.',
      'I hope this was the first of many Apple events I get to be part of. ❤️',
    ],
    note: {
      label: 'Addition',
      paragraphs: [
        'A few weeks after I wrote this, MKBHD published a really interesting video on whether Apple has actually fallen behind in the AI race. It pairs well with the notes above — worth a watch if you care about how Apple is playing this game.',
      ],
      youtubeUrl: 'https://www.youtube.com/watch?v=eWKY0OnPByg',
    },
  },
  {
    id: 'ui-on-demand',
    date: 'Jun 2026',
    title: 'UI-on-demand',
    description:
      'Apps are exploding. Next up: interfaces generated only when you need them.',
    image: '/articles/ui-on-demand.png',
    imageAlt:
      'Two iPhones: describe your widget prompt and a generated marathon countdown widget',
    imageObjectPosition: 'center',
    imageFit: 'contain',
    sourceUrl:
      'https://www.linkedin.com/feed/update/urn:li:activity:7471196611948449792/',
    content: [
      'Continuing the thread I’ve been sharing here on how I see the future of AI, I’ve already talked about the business opportunity of adapting products not only for humans, but also for agents. There’s another market shift that feels increasingly clear to me.',
      'First, apps and digital solutions are going to become more and more saturated. We’ve never seen so many apps being launched. The speed at which they evolve is massive, and so is the competition. It has become incredibly accessible to look at a product you already use, identify a pain point, fix it, and launch your own version for others to try. You can already find examples of people scraping negative reviews from existing apps, identifying the most common complaints, and building a product that addresses those exact problems.',
      'I don’t think this is a bad thing. Quite the opposite. I think it’s a great exercise, and one of the best ways to understand what AI is capable of today. I also believe this window of opportunity will probably exist for the next 2 to 5 years. But I also think I can already see what comes next, and what may eventually disrupt that opportunity.',
      'I’m not sure what the official term will be, but I’ve been calling it “UI-on-demand.” The idea is simple: instead of downloading a dedicated app for every single use case, your device generates the right interface for you, at the exact moment you need it.',
      'Think about Uber. Instead of downloading the Uber app, opening it, setting your destination, choosing a ride, confirming payment, and tracking the driver, what if you could simply tell your device: “I need a ride from point A to point B.” Then, in that moment, your OS generates a native experience that already understands your preferences, knows your saved addresses, has access to your payment methods, uses an interface language you’re familiar with, and can even compare competing services to find the best price or fastest option. Would you still need a dedicated app?',
      'To me, the next step starts to become very clear: UI-less experiences, where the agent handles the task for you and only shows you the result. And UI-on-demand experiences, where you interact with a screen only when it is actually necessary, in a way that is fully personalized to you.',
      'This shift will not happen overnight, which means there will be a very interesting window of opportunity for the people and companies that learn how to navigate it. Is it a little scary? Yes. Leaving the comfort zone and exploring a new paradigm always is. But it’s also incredibly exciting to be living through this transformation in real time.',
    ],
  },
  {
    id: 'your-customer-is-an-agent',
    date: 'May 2026',
    title: 'Time to be B2A',
    description:
      'Maybe you don’t need an AI product. Maybe someone else’s agent needs yours.',
    image: '/articles/your-customer-is-an-agent.png',
    imageAlt:
      'Your app connected to Claude, ChatGPT, and Perplexity as agent consumers',
    imageObjectPosition: 'center',
    imageScale: 0.8,
    sourceUrl:
      'https://www.linkedin.com/feed/update/urn:li:activity:7465759164049481729/',
    content: [
      'One of the best insights I’ve had recently, after talking with friends and listening to AI podcasts, is extremely simple, but I still think many companies are missing it: Your company may not need to offer an AI agent to your customers. Your customer might be someone’s AI agent.',
      'OpenClaw was a great proof of concept for this idea. People want their own agents, customized to their needs, connected to services, MCPs, and APIs that give them enough autonomy to actually get things done. In that world, the user chooses the model they want to use, how much they want to spend, and the best way to interact with it. The agent knows them. It understands the context of their work. It can combine tools, services, and workflows across different products. And because of that, it can often serve them better than an AI experience locked inside a single centralized product.',
      'This changes how we should think about product strategy. Your product is no longer designed only for human users. It also needs to be easy for AI agents to understand, access, and use. That means extremely clear documentation, great connectors, accessible MCPs or APIs, and strong SEO may become a real competitive advantage.',
      'A simple example: try building an app with Claude. There is a good chance it will suggest tools like Supabase and Vercel. That is not random. Those products are easy to explain, easy to integrate, and easy for AI models to reason about.',
      'So maybe the better question is not: “How do we add AI to our product?” Maybe the better question is: “How do we make our product ideal for AI agents to consume?”',
    ],
  },
  {
    id: 'dont-be-the-candle-guy',
    date: 'Apr 2026',
    title: 'Candle Guy',
    description:
      'Trashing AI tools online won’t stop the shift. Learning them will.',
    image: '/articles/dont-be-the-candle-guy.svg',
    imageAlt: 'Candle next to a light bulb',
    sourceUrl:
      'https://www.linkedin.com/feed/update/urn:li:activity:7455628157790945281/',
    content: [
      'It always surprises me when I see designers or developers going on social media to trash tools like Claude Design, Claude Code, or other AI products that are starting to overlap with parts of their skill set and workflow.',
      'Posting angry takes on LinkedIn or social media is not going to stop this shift. Learning how to work with these tools, instead of against them, is simply part of adapting to the job market, just like it always has been.',
      'Don’t be the candle seller who dismissed the light bulb. Don’t be the printing company that bet against the Kindle. New tools will keep emerging, and they will continue reshaping how we work, create, and consume.',
      'Part of Hollywood still pushes back against films that rely heavily on CGI, and while people continue debating whether it is “real art” or not, the technology remains a huge part of productions loved by audiences all over the world, including many movies that simply would not be possible without it.',
      'You do not need to completely change the way you work. You do not need to abandon the tools you already love. But refusing to test and explore new technologies because of bias or fear is probably not doing you any favors either.',
    ],
  },
  {
    id: 'how-fast-is-too-fast',
    date: 'Apr 2026',
    title: 'How fast is too fast?',
    description:
      'From Figma fatigue to Claude Design: when code becomes the single source of truth.',
    image: '/articles/how-fast-is-too-fast.svg',
    imageAlt: 'Design and code merging at high speed',
    sourceUrl:
      'https://www.linkedin.com/feed/update/urn:li:activity:7450942000440209408/',
    content: [
      'Since 2023, I’ve been working with AI, applying it across multiple internal processes. I was also part of the team that helped build one of the first AI solutions for the U.S. mortgage space. Toward the end of last year, I started using Claude more intensively in side projects, and the results were exceptional. Along with others on the team, we began introducing these concepts and exploring their potential inside eVisit. Today, most of the team is using Claude on a daily basis.',
      'Within the design team, a new question started to emerge: should we continue using Figma as our primary tool? It didn’t take long for us to realize that moving away from it could give us something more powerful, a single source of truth for the product: the code itself. The version that actually ships to users, and the one everyone ultimately relies on.',
      'This shift in workflow led us to another challenge, how to handle the lack of fine-tuning tools for UI adjustments that we were used to. We explored a few ideas, but when rumors started circulating that Anthropic was building its own version of tools like Lovable, we got curious. The interesting part is how fast things moved from rumor to reality.',
      'Today, Claude Design was announced, and it’s going to be incredibly helpful for us during this transition. Even in its first version, it already addresses a significant portion of our current pain points. What’s still missing is a way to integrate seamlessly with code in real time, without the need to export. But I’d expect that to be on their roadmap.',
      'At this pace, the team at Anthropic might need to start asking themselves: How fast is too fast when it comes to shipping new products? 😂',
    ],
  },
];

export function getArticleById(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}

/** Next article in list order (wraps to first). */
export function getNextArticle(id: string): Article | undefined {
  const i = articles.findIndex((a) => a.id === id);
  if (i < 0 || articles.length < 2) return undefined;
  return articles[(i + 1) % articles.length];
}
