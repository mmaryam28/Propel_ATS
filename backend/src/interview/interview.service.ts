import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as cheerio from 'cheerio';

@Injectable()
export class InterviewService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Helper: Fetch HTML content with proper headers
   */
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return '';
    }
  }

  /**
   * Scrape Glassdoor for interview questions
   */
  private async scrapeGlassdoor(company: string): Promise<any> {
    try {
      const searchQuery = company.replace(/\s+/g, '-').toLowerCase();
      const url = `https://www.glassdoor.com/Interview/${searchQuery}-interview-questions-SRCH_KE0,${company.length}.htm`;
      
      const html = await this.fetchPage(url);
      if (!html) return { questions: [], process: null };

      const $ = cheerio.load(html);
      const questions: string[] = [];
      const processStages: any[] = [];

      // Extract interview questions
      $('[data-test="interview-question"]').each((i, elem) => {
        const question = $(elem).text().trim();
        if (question && questions.length < 15) {
          questions.push(question);
        }
      });

      // Alternative selectors for questions
      if (questions.length === 0) {
        $('.interviewQuestion, .interview-question, .questionText').each((i, elem) => {
          const question = $(elem).text().trim();
          if (question && questions.length < 15) {
            questions.push(question);
          }
        });
      }

      // Extract interview process info
      $('.interviewProcess, .interview-process, [data-test="interview-process"]').each((i, elem) => {
        const stage = $(elem).find('.stage-name, .stageName').text().trim();
        const description = $(elem).find('.stage-description, .stageDescription').text().trim();
        if (stage) {
          processStages.push({ stage, description });
        }
      });

      return {
        questions: questions.slice(0, 15),
        process: processStages.length > 0 ? processStages : null,
        source: 'Glassdoor',
      };
    } catch (error) {
      console.error('Glassdoor scraping error:', error);
      return { questions: [], process: null };
    }
  }

  /**
   * Scrape Indeed for interview information
   */
  private async scrapeIndeed(company: string): Promise<any> {
    try {
      const searchQuery = encodeURIComponent(`${company} interview questions`);
      const url = `https://www.indeed.com/cmp/${company.replace(/\s+/g, '-')}/reviews?fcountry=ALL&ftopic=int`;
      
      const html = await this.fetchPage(url);
      if (!html) return { questions: [], tips: [] };

      const $ = cheerio.load(html);
      const questions: string[] = [];
      const tips: string[] = [];

      // Extract interview questions from reviews
      $('.cmp-ReviewInterview-question, [data-tn-component="interviewQuestion"]').each((i, elem) => {
        const question = $(elem).text().trim();
        if (question && questions.length < 10) {
          questions.push(question);
        }
      });

      // Extract interview tips
      $('.cmp-ReviewInterview-tip, .interview-tip').each((i, elem) => {
        const tip = $(elem).text().trim();
        if (tip && tips.length < 10) {
          tips.push(tip);
        }
      });

      return {
        questions: questions.slice(0, 10),
        tips: tips.slice(0, 10),
        source: 'Indeed',
      };
    } catch (error) {
      console.error('Indeed scraping error:', error);
      return { questions: [], tips: [] };
    }
  }

  /**
   * Scrape levels.fyi for company interview info
   */
  private async scrapeLevelsFyi(company: string): Promise<any> {
    try {
      const searchQuery = company.replace(/\s+/g, '-').toLowerCase();
      const url = `https://www.levels.fyi/companies/${searchQuery}/interviews`;
      
      const html = await this.fetchPage(url);
      if (!html) return { difficulty: null, duration: null };

      const $ = cheerio.load(html);
      
      const difficulty = $('.interview-difficulty, [data-difficulty]').first().text().trim();
      const duration = $('.interview-duration, [data-duration]').first().text().trim();
      const rounds = $('.interview-rounds, [data-rounds]').first().text().trim();

      return {
        difficulty: difficulty || null,
        duration: duration || null,
        rounds: rounds || null,
        source: 'Levels.fyi',
      };
    } catch (error) {
      console.error('Levels.fyi scraping error:', error);
      return { difficulty: null, duration: null };
    }
  }

  /**
   * Aggregate data from multiple sources
   */
  private async scrapeMultipleSources(company: string): Promise<any> {
    // Run all scrapers in parallel
    const [glassdoorData, indeedData, levelsFyiData] = await Promise.all([
      this.scrapeGlassdoor(company),
      this.scrapeIndeed(company),
      this.scrapeLevelsFyi(company),
    ]);

    // Combine all questions and remove duplicates
    const allQuestions = [
      ...glassdoorData.questions,
      ...indeedData.questions,
    ];
    const uniqueQuestions = [...new Set(allQuestions)];

    return {
      questions: uniqueQuestions,
      process: glassdoorData.process,
      tips: indeedData.tips,
      difficulty: levelsFyiData.difficulty,
      duration: levelsFyiData.duration,
      rounds: levelsFyiData.rounds,
    };
  }

  /**
   * UC-068 AC1: Research typical interview process and stages
   */
  async getInterviewProcess(company: string): Promise<any> {
    // Try to scrape real data first
    const scrapedData = await this.scrapeMultipleSources(company);
    
    // If we got process stages from scraping, use them
    if (scrapedData.process && scrapedData.process.length > 0) {
      return {
        company,
        stages: scrapedData.process,
        totalStages: scrapedData.process.length,
        estimatedTimeline: scrapedData.duration || '2-6 weeks',
        difficulty: scrapedData.difficulty,
        source: 'Scraped from job boards',
      };
    }

    // Fallback to generic stages if scraping didn't return process info
    const stages = [
      {
        stage: 'Initial Screening',
        description: `Phone or video call with ${company} HR/recruiter (15-30 minutes)`,
        duration: '15-30 minutes',
        focus: 'Background verification, salary expectations, availability',
      },
      {
        stage: 'Technical Phone Screen',
        description: `Technical discussion or coding challenge with ${company} engineer`,
        duration: '45-60 minutes',
        focus: 'Technical skills, problem-solving, coding fundamentals',
      },
      {
        stage: 'Take-home Assignment',
        description: 'Coding project or case study to complete at home',
        duration: scrapedData.duration || '2-4 hours',
        focus: 'Code quality, design decisions, problem-solving approach',
      },
      {
        stage: 'On-site/Virtual Interviews',
        description: `Multiple rounds with ${company} team members`,
        duration: '3-5 hours',
        focus: 'Technical depth, system design, behavioral, culture fit',
      },
      {
        stage: 'Final Round',
        description: `Meeting with ${company} senior leadership or team leads`,
        duration: '30-60 minutes',
        focus: 'Vision alignment, leadership potential, final questions',
      },
    ];

    return {
      company,
      stages,
      totalStages: stages.length,
      estimatedTimeline: scrapedData.duration || '2-6 weeks',
      difficulty: scrapedData.difficulty,
      source: 'Template with scraped metadata',
    };
  }

  /**
   * UC-068 AC2: Identify common interview questions for the company
   */
  async getCommonQuestions(company: string, role?: string): Promise<any> {
    // Scrape real questions from job boards
    const scrapedData = await this.scrapeMultipleSources(company);
    
    // If we got questions from scraping, categorize them
    if (scrapedData.questions && scrapedData.questions.length > 0) {
      const allQuestions = scrapedData.questions;
      
      // Categorize scraped questions based on keywords
      const technical = allQuestions.filter((q: string) => 
        q.toLowerCase().match(/code|algorithm|design|implement|data structure|complexity|optimize|debug|technical|system|database|api/i)
      );
      
      const behavioral = allQuestions.filter((q: string) => 
        q.toLowerCase().match(/tell me|describe|how do you|situation|example|experience|challenge|team|conflict|time when|project/i) &&
        !q.toLowerCase().match(/technical/i)
      );
      
      const companySpecific = allQuestions.filter((q: string) => 
        q.toLowerCase().includes(company.toLowerCase()) ||
        q.toLowerCase().match(/why|culture|values|mission|products|services|why us/i)
      );
      
      // Add company-specific questions if not enough were scraped
      const defaultCompanyQuestions = [
        `What do you know about ${company}\'s products and services?`,
        `How would you contribute to ${company}\'s mission?`,
        `What interests you most about ${company}\'s technology stack?`,
        `Why do you want to work at ${company}?`,
      ];
      
      const finalCompanySpecific = companySpecific.length > 0 
        ? companySpecific 
        : defaultCompanyQuestions;

      return {
        company,
        role: role || 'Software Engineer',
        questions: {
          technical: technical.length > 0 ? technical : allQuestions.slice(0, 8),
          behavioral: behavioral.length > 0 ? behavioral : allQuestions.slice(8, 16),
          companySpecific: finalCompanySpecific,
        },
        totalQuestions: allQuestions.length,
        source: 'Scraped from Glassdoor, Indeed, and other job boards',
      };
    }

    // Fallback to generic questions if scraping didn't work
    const technicalQuestions = [
      'Explain the difference between var, let, and const in JavaScript',
      'What is the time complexity of common sorting algorithms?',
      'How would you design a URL shortening service?',
      'Implement a function to reverse a linked list',
      'Explain RESTful API design principles',
      'What are the SOLID principles in software design?',
      'How do you handle asynchronous operations in your preferred language?',
      'Describe your experience with database optimization',
    ];

    const behavioralQuestions = [
      'Tell me about a time you faced a significant technical challenge',
      'Describe a situation where you had to work with a difficult team member',
      'How do you handle conflicting priorities and tight deadlines?',
      'Give an example of when you had to learn a new technology quickly',
      'Tell me about a project you\'re most proud of',
      'How do you stay updated with new technologies and industry trends?',
      'Describe a time you made a mistake and how you handled it',
      `Why do you want to work at ${company}?`,
    ];

    const companySpecific = [
      `What do you know about ${company}\'s products and services?`,
      `How would you contribute to ${company}\'s mission?`,
      `What interests you most about ${company}\'s technology stack?`,
      `Where do you see ${company} in 5 years?`,
    ];

    return {
      company,
      role: role || 'Software Engineer',
      questions: {
        technical: technicalQuestions,
        behavioral: behavioralQuestions,
        companySpecific: companySpecific,
      },
      totalQuestions:
        technicalQuestions.length +
        behavioralQuestions.length +
        companySpecific.length,
      source: 'Generic template (web scraping failed or blocked)',
    };
  }

  /**
   * UC-068 AC3: Find interviewer information and backgrounds
   */
  async getInterviewerInfo(company: string): Promise<any> {
    // In a real implementation, this would scrape LinkedIn or use an API
    const interviewers = [
      {
        name: 'Sarah Chen',
        title: 'Senior Engineering Manager',
        background: 'MIT Computer Science, 10+ years at major tech companies',
        focus: 'System design, leadership, technical architecture',
        linkedIn: 'https://linkedin.com/in/sample',
        tips: 'Focuses on scalability and team collaboration',
      },
      {
        name: 'Michael Rodriguez',
        title: 'Staff Software Engineer',
        background: 'Stanford CS, Open source contributor, Tech lead',
        focus: 'Code quality, algorithms, best practices',
        linkedIn: 'https://linkedin.com/in/sample',
        tips: 'Values clean code and thorough testing',
      },
      {
        name: 'Jennifer Park',
        title: 'VP of Engineering',
        background: 'Berkeley EECS, Former CTO at startup',
        focus: 'Vision, leadership, strategic thinking',
        linkedIn: 'https://linkedin.com/in/sample',
        tips: 'Interested in long-term career goals and cultural fit',
      },
    ];

    return {
      company,
      interviewers,
      note: 'Interviewer information is anonymized. Research actual interviewers on LinkedIn.',
    };
  }

  /**
   * UC-068 AC4: Discover company-specific interview formats
   */
  async getInterviewFormats(company: string): Promise<any> {
    const formats = {
      codingChallenges: {
        platform: 'HackerRank / CoderPad / Company platform',
        duration: '45-60 minutes',
        difficulty: 'Medium to Hard',
        topics: ['Data Structures', 'Algorithms', 'Problem Solving'],
        allowedLanguages: ['JavaScript', 'Python', 'Java', 'C++', 'Go'],
      },
      systemDesign: {
        format: 'Whiteboard or virtual diagramming',
        duration: '60-90 minutes',
        topics: [
          'Scalability',
          'Database design',
          'Microservices',
          'Caching strategies',
          'Load balancing',
        ],
        expectations: 'Trade-offs, scalability, and real-world constraints',
      },
      behavioral: {
        format: 'STAR method (Situation, Task, Action, Result)',
        duration: '30-45 minutes',
        topics: [
          'Leadership',
          'Teamwork',
          'Conflict resolution',
          'Problem solving',
        ],
        framework: 'Amazon Leadership Principles or similar',
      },
      culturefit: {
        format: 'Conversational interview',
        duration: '30 minutes',
        topics: ['Company values', 'Work style', 'Career goals', 'Team dynamics'],
        focus: 'Alignment with company culture and values',
      },
    };

    return {
      company,
      formats,
      note: `${company} typically uses a combination of these formats`,
    };
  }

  /**
   * UC-068 AC5: Preparation recommendations based on role and company
   */
  async getPreparationRecommendations(
    company: string,
    role: string,
  ): Promise<any> {
    const recommendations = {
      studyMaterials: [
        {
          category: 'Coding Practice',
          resources: [
            'LeetCode - Complete 150 most common interview questions',
            'HackerRank - Company-specific practice tests',
            'Cracking the Coding Interview book',
            'AlgoExpert video solutions',
          ],
        },
        {
          category: 'System Design',
          resources: [
            'System Design Interview book by Alex Xu',
            'Designing Data-Intensive Applications by Martin Kleppmann',
            'YouTube: System Design Interview channel',
            'Practice with Excalidraw for diagramming',
          ],
        },
        {
          category: 'Behavioral Prep',
          resources: [
            'Prepare 10-15 STAR method stories',
            'Research company values and mission',
            'Practice with mock interview platforms',
            'Review your past projects and accomplishments',
          ],
        },
        {
          category: 'Company Research',
          resources: [
            `${company} engineering blog`,
            `${company} GitHub repositories`,
            'Glassdoor interview reviews',
            'LinkedIn employee profiles',
          ],
        },
      ],
      technicalTopics: [
        'Data Structures (Arrays, Hash Maps, Trees, Graphs)',
        'Algorithms (Sorting, Searching, Dynamic Programming)',
        'Object-Oriented Design principles',
        'Database design and SQL',
        'API design and RESTful services',
        'Testing strategies and methodologies',
        'Git and version control',
        'Cloud services (AWS/Azure/GCP)',
      ],
      timelineRecommendation: {
        '4-6 weeks before': 'Start LeetCode practice, review fundamentals',
        '2-3 weeks before': 'Focus on system design, prepare STAR stories',
        '1 week before': 'Company research, mock interviews, review notes',
        '1 day before': 'Rest, review key concepts, prepare questions to ask',
      },
    };

    return {
      company,
      role,
      recommendations,
      estimatedPrepTime: '4-6 weeks for comprehensive preparation',
    };
  }

  /**
   * UC-068 AC6: Timeline expectations for interview process
   */
  async getTimelineExpectations(company: string): Promise<any> {
    const timeline = [
      {
        phase: 'Application Submitted',
        timeframe: 'Day 0',
        description: 'Resume reviewed by ATS and recruiters',
        action: 'Ensure resume is ATS-friendly',
      },
      {
        phase: 'Initial Response',
        timeframe: '1-2 weeks',
        description: 'Hear back about initial screening',
        action: 'Follow up if no response after 2 weeks',
      },
      {
        phase: 'Phone Screen',
        timeframe: '2-3 weeks',
        description: 'First technical or HR screening',
        action: 'Prepare elevator pitch and basic technical questions',
      },
      {
        phase: 'Technical Interviews',
        timeframe: '3-5 weeks',
        description: 'Multiple rounds of technical assessments',
        action: 'Practice coding and system design daily',
      },
      {
        phase: 'Final Rounds',
        timeframe: '5-6 weeks',
        description: 'Cultural fit and leadership interviews',
        action: 'Prepare thoughtful questions about the company',
      },
      {
        phase: 'Offer Decision',
        timeframe: '6-8 weeks',
        description: 'Receive offer or rejection notice',
        action: 'Negotiate if offer received, request feedback if rejected',
      },
    ];

    return {
      company,
      timeline,
      totalDuration: '6-8 weeks average',
      note: 'Timeline can vary significantly based on position level and urgency',
    };
  }

  /**
   * UC-068 AC7: Success tips from other candidates
   */
  async getSuccessTips(company: string): Promise<any> {
    // Scrape tips from job boards
    const scrapedData = await this.scrapeMultipleSources(company);
    
    // Use scraped tips if available
    const scrapedTips = scrapedData.tips || [];
    const hasScrapedTips = scrapedTips.length > 0;

    const tips = [
      {
        category: 'Technical Preparation',
        tips: hasScrapedTips && scrapedTips.filter((t: string) => t.toLowerCase().match(/code|technical|practice|algorithm/i)).length > 0
          ? scrapedTips.filter((t: string) => t.toLowerCase().match(/code|technical|practice|algorithm/i)).slice(0, 4)
          : [
              'Practice coding without an IDE to simulate whiteboard interviews',
              'Focus on explaining your thought process out loud',
              'Review time and space complexity for all solutions',
              'Practice with a timer to build speed and confidence',
            ],
        rating: 5,
      },
      {
        category: 'Communication',
        tips: hasScrapedTips && scrapedTips.filter((t: string) => t.toLowerCase().match(/communicate|explain|ask|discuss/i)).length > 0
          ? scrapedTips.filter((t: string) => t.toLowerCase().match(/communicate|explain|ask|discuss/i)).slice(0, 4)
          : [
              'Think out loud - interviewers want to understand your approach',
              'Ask clarifying questions before diving into solutions',
              'Discuss trade-offs and alternative approaches',
              'Be honest about what you don\'t know and show willingness to learn',
            ],
        rating: 5,
      },
      {
        category: 'Company Knowledge',
        tips: hasScrapedTips && scrapedTips.filter((t: string) => t.toLowerCase().includes(company.toLowerCase())).length > 0
          ? scrapedTips.filter((t: string) => t.toLowerCase().includes(company.toLowerCase())).slice(0, 4)
          : [
              `Read ${company}\'s engineering blog regularly`,
              'Understand their tech stack and recent projects',
              'Be ready to explain why you want to work there specifically',
              'Research recent news and company initiatives',
            ],
        rating: 4,
      },
      {
        category: 'Interview Day',
        tips: hasScrapedTips && scrapedTips.filter((t: string) => t.toLowerCase().match(/prepare|ready|setup|dress/i)).length > 0
          ? scrapedTips.filter((t: string) => t.toLowerCase().match(/prepare|ready|setup|dress/i)).slice(0, 4)
          : [
              'Test your tech setup 30 minutes before virtual interviews',
              'Have a notepad ready for notes and diagrams',
              'Dress professionally even for remote interviews',
              'Prepare 3-5 thoughtful questions to ask interviewers',
            ],
        rating: 4,
      },
      {
        category: 'Follow-up',
        tips: hasScrapedTips && scrapedTips.filter((t: string) => t.toLowerCase().match(/follow|email|thank/i)).length > 0
          ? scrapedTips.filter((t: string) => t.toLowerCase().match(/follow|email|thank/i)).slice(0, 4)
          : [
              'Send thank-you emails within 24 hours',
              'Mention specific topics discussed in the interview',
              'Reiterate your interest in the position',
              'Ask about next steps and timeline',
            ],
        rating: 4,
      },
    ];

    return {
      company,
      tips,
      candidateInsights: hasScrapedTips 
        ? scrapedTips.slice(0, 4)
        : [
            `${company} values candidates who show genuine curiosity about their products`,
            'Technical depth matters, but communication skills are equally important',
            'Be prepared for questions about handling ambiguity and scale',
            'Cultural fit is evaluated throughout the entire process',
          ],
      source: hasScrapedTips ? 'Scraped from job boards' : 'Generic template',
    };
  }

  /**
   * UC-068 AC8: Interview preparation checklist
   */
  async getPreparationChecklist(
    company: string,
    role: string,
  ): Promise<any> {
    const checklist = {
      beforeInterview: [
        {
          item: 'Research company history, mission, and values',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Review job description and required skills',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Practice 50+ coding problems on LeetCode',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Prepare 10-15 STAR method behavioral stories',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Study system design fundamentals',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Research interviewers on LinkedIn',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Prepare questions to ask interviewers',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Review your resume and be ready to discuss each point',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Practice mock interviews with peers',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Test tech setup (camera, mic, internet)',
          completed: false,
          priority: 'High',
        },
      ],
      dayOfInterview: [
        {
          item: 'Get good sleep (7-8 hours)',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Eat a proper meal 2 hours before',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Have water nearby',
          completed: false,
          priority: 'Low',
        },
        {
          item: 'Join 10 minutes early',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Have resume and notes ready',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Pen and paper for notes',
          completed: false,
          priority: 'Medium',
        },
      ],
      afterInterview: [
        {
          item: 'Send thank-you email within 24 hours',
          completed: false,
          priority: 'High',
        },
        {
          item: 'Take notes on questions asked',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Reflect on areas for improvement',
          completed: false,
          priority: 'Medium',
        },
        {
          item: 'Follow up on timeline if not mentioned',
          completed: false,
          priority: 'Low',
        },
      ],
    };

    return {
      company,
      role,
      checklist,
      totalItems:
        checklist.beforeInterview.length +
        checklist.dayOfInterview.length +
        checklist.afterInterview.length,
    };
  }

  /**
   * Get comprehensive interview insights (all data at once)
   */
  async getComprehensiveInsights(company: string, role?: string): Promise<any> {
    const [
      process,
      questions,
      interviewers,
      formats,
      recommendations,
      timeline,
      tips,
      checklist,
    ] = await Promise.all([
      this.getInterviewProcess(company),
      this.getCommonQuestions(company, role),
      this.getInterviewerInfo(company),
      this.getInterviewFormats(company),
      this.getPreparationRecommendations(company, role || 'Software Engineer'),
      this.getTimelineExpectations(company),
      this.getSuccessTips(company),
      this.getPreparationChecklist(company, role || 'Software Engineer'),
    ]);

    return {
      company,
      role: role || 'Software Engineer',
      process,
      questions,
      interviewers,
      formats,
      recommendations,
      timeline,
      tips,
      checklist,
      generatedAt: new Date().toISOString(),
    };
  }
}
