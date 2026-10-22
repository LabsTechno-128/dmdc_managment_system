import { api } from '../lib/api';

export interface HeroSection {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}

export interface AboutSection {
  badge: string;
  title: string;
  description: string;
  bulletPoints: string[];
  image: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
  link: string;
  checkupBadge?: string;
  checkupSubtitle?: string;
  checkupTitle?: string;
}

export interface ServicesSection {
  badge: string;
  title: string;
  description: string;
  items: ServiceItem[];
}

export interface StatItem {
  number: string;
  label: string;
}

export interface StatsSection {
  items: StatItem[];
}

export interface ArticleItem {
  id: string;
  title: string;
  tag: string;
  readTime: string;
  date: string;
  image: string;
  excerpt: string;
}

export interface ArticlesSection {
  badge: string;
  title: string;
  description: string;
  items: ArticleItem[];
}

export interface ContactSection {
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  openingHours: string;
  emergencyNote: string;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
}

export interface AdminDoctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  degree: string;
  avatar: string;
  rating: string;
  bio: string;
  experience: string;
  consultationFee: number;
  followUpFee: number;
  isPublished: boolean;
  createdAt: string;
}

export interface LandingContentData {
  id?: string;
  hero: HeroSection;
  about: AboutSection;
  services: ServicesSection;
  stats: StatsSection;
  articles: ArticlesSection;
  contact: ContactSection;
  seo: SeoConfig;
  sectionVisibility?: Record<string, boolean>;
  doctorSettings?: {
    order?: string[];
    displayLimit?: number;
  };
  updatedAt?: string;
}

export const landingService = {
  // Fetch landing content for administrative management
  getAdminContent: async (): Promise<LandingContentData> => {
    const response = await api.get('/landing/admin/content');
    return response.data;
  },

  // Save/update landing content
  updateAdminContent: async (data: Partial<LandingContentData>): Promise<LandingContentData> => {
    const response = await api.put('/landing/admin/content', data);
    return response.data;
  },

  // Reset landing content to approved system defaults (Superadmin only)
  resetAdminContent: async (): Promise<{ message: string; content: LandingContentData }> => {
    const response = await api.post('/landing/admin/reset');
    return response.data;
  },

  // Doctors management for landing page display
  getAdminDoctors: async (): Promise<AdminDoctor[]> => {
    const response = await api.get('/landing/admin/doctors');
    return response.data;
  },

  // Toggle doctor visibility on the public landing page
  toggleDoctorVisibility: async (id: string, isPublished: boolean): Promise<{ id: string; isPublished: boolean; message: string }> => {
    const response = await api.patch(`/landing/admin/doctors/${id}/visibility`, { isPublished });
    return response.data;
  },

  // Update doctor public profile for landing cards
  updateDoctorProfile: async (id: string, data: Partial<AdminDoctor>): Promise<{ id: string; message: string; doctor: any }> => {
    const response = await api.patch(`/landing/admin/doctors/${id}/profile`, data);
    return response.data;
  },

  // Update custom display order of doctors on landing page
  updateDoctorOrder: async (doctorIds: string[]): Promise<{ order: string[]; message: string }> => {
    const response = await api.put('/landing/admin/doctors/order', { doctorIds });
    return response.data;
  },

  // Upload an image asset to server/Cloudinary
  uploadImage: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Public endpoints for preview & validation
  getPublicContent: async (): Promise<any> => {
    const response = await api.get('/landing/content');
    return response.data;
  },

  getPublicSeo: async (): Promise<any> => {
    const response = await api.get('/landing/seo');
    return response.data;
  },
};
