export type Review = {
  workerName: string;
  reviewText: string;
  rating: number; // Rating out of 5
  date: Date;
};

export type Agency = {
  id: string;
  name: string;
  trustScore: number;
  details: string;
  reviews: Review[];
};

// Update your existing agency constants to be of the new type and add them to an array
const agency1: Agency = {
  id: "a1",
  name: "Global Recruiters Ltd.",
  trustScore: 0.92,
  details:
    "Global Recruiters has been a trusted partner for labor migration for over 15 years. We specialize in placements in the construction and hospitality sectors across the GCC region. Our commitment to ethical practices is reflected in our high trust score.",
  reviews: [
    {
      workerName: "Rahim Islam",
      reviewText:
        "Very helpful and transparent process from start to finish. Highly recommended.",
      rating: 5,
      date: new Date(2025, 7, 15),
    },
    {
      workerName: "Fatima Begum",
      reviewText: "The contract was exactly as promised. Thank you!",
      rating: 4,
      date: new Date(2025, 6, 22),
    },
  ],
};

const agency2: Agency = {
  id: "a2",
  name: "Middle East Manpower",
  trustScore: 0.65,
  details:
    "We connect skilled workers with opportunities in the Middle East. We are working to improve our processes and transparency.",
  reviews: [
    {
      workerName: "Anonymous",
      reviewText: "The process was a bit slow, but I got the job in the end.",
      rating: 3,
      date: new Date(2025, 5, 10),
    },
  ],
};

const agency3: Agency = {
  id: "a3",
  name: "Asia Connect",
  trustScore: 0.88,
  details:
    "Asia Connect focuses on technical and skilled labor placements across Asia and the Gulf.",
  reviews: [],
};

const agencies: Agency[] = [agency1, agency2, agency3];

// Add this new function to fetch an agency by its ID
export const getAgencyById = (id: string) => {
  return agencies.find((agency) => agency.id === id);
};

// Define the type for a Job
export type Job = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  country: string;
  salary: string;
  contractDuration: string;
  jobDescription: string;
  qualifications: string[];
  agency: {
    id: string;
    name: string;
    trustScore: number;
  };
};

// Dummy Job Listings
export const jobListings: Job[] = [
  {
    id: "jw-123",
    title: "Senior Welder",
    companyName: "Qatar Gas",
    location: "Doha",
    country: "Qatar",
    salary: "$2500/mo",
    contractDuration: "2 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency1,
  },
  {
    id: "jc-456",
    title: "Construction Worker",
    companyName: "Al-Kharafi Global",
    location: "Riyadh",
    country: "Saudi Arabia",
    salary: "$1800/mo",
    contractDuration: "3 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency2,
  },
  {
    id: "hh-789",
    title: "Hotel Housekeeping Staff",
    companyName: "Emirates Palace",
    location: "Abu Dhabi",
    country: "UAE",
    salary: "$2100/mo",
    contractDuration: "2 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency1,
  },
  {
    id: "mt-101",
    title: "Mechanical Technician",
    companyName: "Saudi Aramco",
    location: "Dammam",
    country: "Saudi Arabia",
    salary: "$3200/mo",
    contractDuration: "4 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency3,
  },
  {
    id: "el-202",
    title: "Electrician",
    companyName: "Dubai Electricity & Water Authority",
    location: "Dubai",
    country: "UAE",
    salary: "$2800/mo",
    contractDuration: "2 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency3,
  },
  {
    id: "dr-303",
    title: "Heavy Duty Driver",
    companyName: "Qatar Navigation",
    location: "Doha",
    country: "Qatar",
    salary: "$2200/mo",
    contractDuration: "3 Years",
    jobDescription: "...",
    qualifications: [],
    agency: agency1,
  },
];

export const getJobById = (id: string) => {
  return jobListings.find((job) => job.id === id);
};

export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Offer Received"
  | "Rejected";

export type Application = {
  id: string;
  job: Job;
  status: ApplicationStatus;
  submissionDate: Date;
};

export const applications: Application[] = [
  {
    id: "app1",
    job: jobListings[0], // Senior Welder
    status: "Offer Received",
    submissionDate: new Date(2025, 7, 15),
  },
  {
    id: "app2",
    job: jobListings[1], // Construction Worker
    status: "Under Review",
    submissionDate: new Date(2025, 8, 10),
  },
  {
    id: "app3",
    job: jobListings[4], // Electrician
    status: "Submitted",
    submissionDate: new Date(2025, 8, 20),
  },
  {
    id: "app4",
    job: jobListings[5], // Heavy Duty Driver
    status: "Rejected",
    submissionDate: new Date(2025, 6, 25),
  },
];

export const getApplicationById = (id: string) => {
  return applications.find((app) => app.id === id);
};

export type MilestoneStatus = "Completed" | "In Progress" | "Pending";

export type Milestone = {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
};

export const milestones: Milestone[] = [
  {
    id: "ms1",
    title: "Visa Application",
    status: "Completed",
    description:
      "Approved on August 25, 2025. Your passport is ready for collection.",
  },
  {
    id: "ms2",
    title: "Medical Examination",
    status: "In Progress",
    description:
      "Your medical reports are currently being processed by the designated clinic.",
  },
  {
    id: "ms3",
    title: "BMET Smart Card",
    status: "Pending",
    description:
      "The agency will apply for your smart card once the medical exam is cleared.",
  },
  {
    id: "ms4",
    title: "Flight Booking",
    status: "Pending",
    description:
      "Your flight will be booked once all prior steps are complete.",
  },
];

export type GrievanceStatus = "Submitted" | "Investigating" | "Resolved";

export type Grievance = {
  caseId: string;
  title: string;
  submissionDate: Date;
  status: GrievanceStatus;
};

export const grievances: Grievance[] = [
  {
    caseId: "C-789123",
    title: "Unpaid Overtime for July 2025",
    status: "Investigating",
    submissionDate: new Date(2025, 7, 5), // Note: Month is 0-indexed, so 7 is August
  },
  {
    caseId: "C-789122",
    title: "Unsafe living conditions",
    status: "Resolved",
    submissionDate: new Date(2025, 6, 15),
  },
  {
    caseId: "C-789121",
    title: "Delayed Salary Payment for May 2025",
    status: "Resolved",
    submissionDate: new Date(2025, 5, 2),
  },
];

export type NotificationType =
  | "Application"
  | "Credential"
  | "Grievance"
  | "General";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: Date;
  type: NotificationType;
  isRead: boolean;
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Offer Received!",
    body: "You have received a job offer from Qatar Gas for the Senior Welder position.",
    date: new Date(2025, 7, 28), // Aug 28, 2025
    type: "Application",
    isRead: false,
  },
  {
    id: "n2",
    title: "New Credential Issued",
    body: 'Your "Verified Passport" credential has been added to your wallet.',
    date: new Date(2025, 7, 25), // Aug 25, 2025
    type: "Credential",
    isRead: false,
  },
  {
    id: "n3",
    title: "Grievance Case Update",
    body: "Your case #C-789123 is now under investigation by a BMET official.",
    date: new Date(2025, 7, 22), // Aug 22, 2025
    type: "Grievance",
    isRead: true,
  },
  {
    id: "n4",
    title: "Welcome to SafePass",
    body: "Complete your profile to start applying for jobs.",
    date: new Date(2025, 7, 1), // Aug 1, 2025
    type: "General",
    isRead: true,
  },
];

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    id: "faq1",
    question: "How do I recover my wallet if I lose my phone?",
    answer:
      'You must use the 12-word recovery phrase you saved during signup. On a new device, go to the login screen and tap "Recover Wallet" to begin the process. If you have lost your phrase, access cannot be recovered.',
  },
  {
    id: "faq2",
    question: "Is my personal data and documents safe?",
    answer:
      "Yes. Your personal documents and credentials are encrypted and stored in your self-sovereign wallet. Only you can control who sees your information. SafePass cannot access your private data.",
  },
  {
    id: "faq3",
    question: "What is a Smart Contract?",
    answer:
      "It is a digital employment agreement stored on the blockchain. Its terms cannot be changed after you sign it, which protects you from contract substitution and ensures your employer honors the agreement.",
  },
  {
    id: "faq4",
    question: "Who sees my grievance report if I file one?",
    answer:
      "Grievance reports are sent directly to authorized officials at government bodies like the BMET and trusted partner NGOs for an impartial investigation. You can choose to submit anonymously to protect your identity.",
  },
];
