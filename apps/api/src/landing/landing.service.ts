import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DEFAULT_LANDING_CONTENT, INITIAL_DOCTORS } from './landing.seed';
import { PublicBookAppointmentDto } from './dto/public-book-appointment.dto';
import { UpdateLandingContentDto } from './dto/update-landing-content.dto';
import {
    AppointmentBookingType,
    AppointmentStatus,
    AppointmentType,
    Doctor,
    Gender,
} from '@hospital/database';

@Injectable()
export class LandingService implements OnModuleInit {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly appointmentsService: AppointmentsService,
    ) {}

    async onModuleInit() {
        try {
            await this.seedLandingContentIfEmpty();
            await this.seedDoctorsIfEmpty();
        } catch (err) {
            console.warn('[LandingService] Init seed check warning:', err);
        }
    }

    private async seedLandingContentIfEmpty() {
        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            content = repo.create({
                id: 'default',
                hero: DEFAULT_LANDING_CONTENT.hero,
                about: DEFAULT_LANDING_CONTENT.about,
                services: DEFAULT_LANDING_CONTENT.services,
                stats: DEFAULT_LANDING_CONTENT.stats,
                articles: DEFAULT_LANDING_CONTENT.articles,
                contact: DEFAULT_LANDING_CONTENT.contact,
                seo: DEFAULT_LANDING_CONTENT.seo,
                sectionVisibility: DEFAULT_LANDING_CONTENT.sectionVisibility,
                doctorSettings: {},
            });
            await repo.save(content);
            console.log('✅ [LandingService] Initialized default landing content');
        }
    }

    private async seedDoctorsIfEmpty() {
        const repo = this.databaseService.repoDoctor();
        for (const docData of INITIAL_DOCTORS) {
            const existing = await repo.findOne({
                where: { firstName: docData.firstName, lastName: docData.lastName },
            });
            if (!existing) {
                const doc = repo.create(docData as Partial<Doctor>);
                await repo.save(doc);
            } else if (!existing.avatar) {
                await repo.update(existing.id, {
                    avatar: docData.avatar,
                    bio: docData.bio,
                    rating: docData.rating,
                    department: docData.department,
                    experience: docData.experience,
                    consultationFee: docData.consultationFee,
                    followUpFee: docData.followUpFee,
                    degree: docData.degree,
                    isPublished: true,
                });
            }
        }
        // Unpublish test rows that have gibberish names
        const all = await repo.find();
        for (const d of all) {
            if (d.firstName.startsWith('sdf') || d.lastName.startsWith('dsf') || d.specialization.includes('sdf')) {
                await repo.update(d.id, { isPublished: false });
            }
        }
    }

    async getPublicContent() {
        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            await this.seedLandingContentIfEmpty();
            content = await repo.findOne({ where: { id: 'default' } });
        }

        return {
            hero: content?.hero ?? DEFAULT_LANDING_CONTENT.hero,
            about: content?.about ?? DEFAULT_LANDING_CONTENT.about,
            services: content?.services ?? DEFAULT_LANDING_CONTENT.services,
            stats: content?.stats ?? DEFAULT_LANDING_CONTENT.stats,
            articles: content?.articles ?? DEFAULT_LANDING_CONTENT.articles,
            contact: content?.contact ?? DEFAULT_LANDING_CONTENT.contact,
            sectionVisibility: content?.sectionVisibility ?? DEFAULT_LANDING_CONTENT.sectionVisibility,
            doctorSettings: content?.doctorSettings ?? {},
            updatedAt: content?.updatedAt ?? new Date(),
        };
    }

    async getSeoMetadata() {
        const repo = this.databaseService.repoLandingContent();
        const content = await repo.findOne({ where: { id: 'default' } });
        return content?.seo ?? DEFAULT_LANDING_CONTENT.seo;
    }

    async getSitemapXml(baseUrl: string = 'http://localhost:5173') {
        const today = new Date().toISOString().split('T')[0];
        const routes = [
            { path: '', changefreq: 'daily', priority: '1.0' },
            { path: '#services', changefreq: 'weekly', priority: '0.8' },
            { path: '#about', changefreq: 'weekly', priority: '0.8' },
            { path: '#doctors', changefreq: 'weekly', priority: '0.8' },
            { path: '#articles', changefreq: 'weekly', priority: '0.7' },
            { path: '#appointment', changefreq: 'weekly', priority: '0.9' },
        ];

        const cleanBase = baseUrl.replace(/\/$/, '');
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const r of routes) {
            xml += `  <url>\n`;
            xml += `    <loc>${cleanBase}/${r.path}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
            xml += `    <priority>${r.priority}</priority>\n`;
            xml += `  </url>\n`;
        }
        xml += `</urlset>`;
        return xml;
    }

    getRobotsTxt(baseUrl: string = 'http://localhost:5173') {
        const cleanBase = baseUrl.replace(/\/$/, '');
        return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${cleanBase}/api/landing/sitemap.xml\n`;
    }

    async getPublicDoctors(search?: string, specialty?: string) {
        const repo = this.databaseService.repoDoctor();
        const qb = repo.createQueryBuilder('doctor')
            .where('doctor.deletedAt IS NULL')
            .andWhere('doctor.isPublished = :published', { published: true })
            .orderBy('doctor.createdAt', 'ASC');

        if (search) {
            qb.andWhere(
                '(doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR doctor.specialization ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (specialty) {
            qb.andWhere('doctor.specialization ILIKE :specialty', { specialty: `%${specialty}%` });
        }

        let doctors = await qb.getMany();

        const contentRepo = this.databaseService.repoLandingContent();
        const content = await contentRepo.findOne({ where: { id: 'default' } });
        const order = content?.doctorSettings?.order;
        if (order && Array.isArray(order) && order.length > 0) {
            doctors.sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
        }

        const bgColors = ['bg-blue-50', 'bg-orange-50', 'bg-purple-50', 'bg-green-50'];
        const defaultAvatar = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=500';

        return doctors.map((doc, idx) => ({
            id: doc.id,
            name: `Dr. ${doc.firstName} ${doc.lastName}`.trim(),
            firstName: doc.firstName,
            lastName: doc.lastName,
            specialty: doc.specialization,
            degree: doc.degree || 'MBBS, Specialist',
            rating: doc.rating || '4.9',
            reviewsCount: '120+',
            image: doc.avatar || defaultAvatar,
            bgColor: bgColors[idx % bgColors.length],
            bio: doc.bio || 'Compassionate healthcare professional dedicated to excellence in patient treatment and diagnosis.',
            availability: doc.availability || 'Mon - Fri (09:00 AM - 05:00 PM)',
            consultationFee: Number(doc.consultationFee) || 0,
            followUpFee: Number(doc.followUpFee) || 0,
            department: doc.department || doc.specialization,
            experience: doc.experience || '10+ Years',
        }));
    }

    async getDoctorAvailability(doctorId: string, dateStr?: string) {
        const doctorRepo = this.databaseService.repoDoctor();
        const doctor = await doctorRepo.findOne({
            where: { id: doctorId },
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor with ID "${doctorId}" not found`);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const selectedDate = dateStr || todayStr;

        if (selectedDate < todayStr) {
            throw new BadRequestException('Cannot check availability for past dates');
        }

        const apptRepo = this.databaseService.repoAppointment();
        const existingAppts = await apptRepo.createQueryBuilder('appt')
            .where('appt.doctorId = :doctorId', { doctorId })
            .andWhere('DATE(appt."appointmentDate") = :selectedDate', { selectedDate })
            .andWhere('appt.status != :cancelledStatus', { cancelledStatus: AppointmentStatus.Cancelled })
            .getMany();

        // Exclude cancelled / rejected appointments and normalize time to HH:mm
        const bookedTimes = new Set(
            existingAppts.map(a => (a.appointmentTime ? a.appointmentTime.slice(0, 5) : '')),
        );

        const allSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        const now = new Date();
        const isToday = selectedDate === todayStr;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const slots = allSlots.map(time => {
            const [hStr, mStr] = time.split(':');
            const slotHour = parseInt(hStr, 10);
            const slotMinute = parseInt(mStr, 10);

            let isPassed = false;
            if (isToday) {
                if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
                    isPassed = true;
                }
            }

            const isBooked = bookedTimes.has(time);
            return {
                time,
                available: !isPassed && !isBooked,
                reason: isPassed ? 'Past' : (isBooked ? 'Booked' : 'Available'),
            };
        });

        return {
            doctorId: doctor.id,
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
            specialty: doctor.specialization,
            consultationFee: Number(doctor.consultationFee) || 0,
            date: selectedDate,
            slots,
        };
    }

    async bookPublicAppointment(dto: PublicBookAppointmentDto) {
        const doctorRepo = this.databaseService.repoDoctor();
        const doctor = await doctorRepo.findOne({
            where: { id: dto.doctorId, isPublished: true },
        });

        if (!doctor) {
            throw new NotFoundException('Selected doctor was not found or is currently not available for bookings');
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (dto.appointmentDate < todayStr) {
            throw new BadRequestException('Appointment date cannot be in the past');
        }

        // Check slot availability
        const apptRepo = this.databaseService.repoAppointment();
        const existing = await apptRepo.findOne({
            where: {
                doctorId: dto.doctorId,
                appointmentDate: new Date(dto.appointmentDate),
                appointmentTime: dto.appointmentTime,
            },
        });

        if (existing && existing.status !== AppointmentStatus.Cancelled) {
            throw new ConflictException(
                'This time slot is already booked for this doctor. Please select another available time slot.',
            );
        }

        // Delegate to existing AppointmentsService.create
        const isToday = dto.appointmentDate === todayStr;
        const bookingType = isToday ? AppointmentBookingType.LIVE : AppointmentBookingType.FUTURE;

        let normalizedGender: Gender | undefined;
        if (dto.gender) {
            const g = String(dto.gender).toUpperCase();
            if (g === 'MALE' || g === 'M') normalizedGender = Gender.MALE;
            else if (g === 'FEMALE' || g === 'F') normalizedGender = Gender.FEMALE;
            else if (g === 'OTHER' || g === 'O') normalizedGender = Gender.OTHER;
        }

        const appointment = await this.appointmentsService.create({
            doctorId: dto.doctorId,
            bookingType,
            appointmentDate: dto.appointmentDate,
            appointmentTime: dto.appointmentTime,
            name: dto.name.trim(),
            phone: dto.phone.trim(),
            age: dto.age,
            gender: normalizedGender,
            visitReason: dto.visitReason,
            notes: dto.notes,
            appointmentType: AppointmentType.New,
            status: AppointmentStatus.Pending,
            consultationFee: Number(doctor.consultationFee) || 0,
            followUpFee: Number(doctor.followUpFee) || 0,
        });

        return {
            appointmentId: appointment.id,
            bookingReference: `DMDC-${appointment.id.slice(0, 8).toUpperCase()}`,
            doctor: {
                id: doctor.id,
                name: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
                specialty: doctor.specialization,
                consultationFee: Number(doctor.consultationFee) || 0,
            },
            patient: {
                name: dto.name.trim(),
                phone: dto.phone.trim(),
            },
            appointmentDate: dto.appointmentDate,
            appointmentTime: dto.appointmentTime,
            status: appointment.status,
            message: 'Your appointment has been successfully scheduled! Our patient care team will contact you to confirm details.',
        };
    }

    async getAdminContent() {
        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            await this.seedLandingContentIfEmpty();
            content = await repo.findOne({ where: { id: 'default' } });
        }
        return content;
    }

    async updateAdminContent(dto: UpdateLandingContentDto, user?: any) {
        // Strict role validation: Receptionists are not authorized to modify SEO settings
        if (user?.role === 'receptionist' && dto.seo) {
            throw new ForbiddenException('Receptionists are not authorized to modify SEO settings');
        }

        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            content = repo.create({ id: 'default' });
        }

        if (dto.hero) content.hero = { ...content.hero, ...dto.hero };
        if (dto.about) content.about = { ...content.about, ...dto.about };
        if (dto.services) content.services = { ...content.services, ...dto.services };
        if (dto.stats) content.stats = { ...content.stats, ...dto.stats };
        if (dto.articles) content.articles = { ...content.articles, ...dto.articles };
        if (dto.contact) content.contact = { ...content.contact, ...dto.contact };
        if (dto.seo && user?.role !== 'receptionist') content.seo = { ...content.seo, ...dto.seo };
        if (dto.sectionVisibility) {
            content.sectionVisibility = { ...content.sectionVisibility, ...dto.sectionVisibility };
        }
        if (dto.doctorSettings) {
            content.doctorSettings = { ...content.doctorSettings, ...dto.doctorSettings };
        }

        await repo.save(content);
        return content;
    }

    async resetAdminContent() {
        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            content = repo.create({ id: 'default' });
        }
        content.hero = DEFAULT_LANDING_CONTENT.hero;
        content.about = DEFAULT_LANDING_CONTENT.about;
        content.services = DEFAULT_LANDING_CONTENT.services;
        content.stats = DEFAULT_LANDING_CONTENT.stats;
        content.articles = DEFAULT_LANDING_CONTENT.articles;
        content.contact = DEFAULT_LANDING_CONTENT.contact;
        content.seo = DEFAULT_LANDING_CONTENT.seo;
        content.sectionVisibility = DEFAULT_LANDING_CONTENT.sectionVisibility;
        content.doctorSettings = {};

        await repo.save(content);
        return { message: 'Landing content reset to initial DMDC defaults successfully', content };
    }

    async getAdminDoctors() {
        const repo = this.databaseService.repoDoctor();
        const contentRepo = this.databaseService.repoLandingContent();
        const [doctors, content] = await Promise.all([
            repo.find({
                where: { deletedAt: undefined },
                order: { createdAt: 'ASC' },
            }),
            contentRepo.findOne({ where: { id: 'default' } }),
        ]);

        const order = content?.doctorSettings?.order;
        if (order && Array.isArray(order) && order.length > 0) {
            doctors.sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
        }

        const defaultAvatar = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=500';

        return doctors.map((doc) => ({
            id: doc.id,
            name: `Dr. ${doc.firstName} ${doc.lastName}`.trim(),
            firstName: doc.firstName,
            lastName: doc.lastName,
            specialty: doc.specialization,
            department: doc.department || doc.specialization,
            degree: doc.degree || 'MBBS, Specialist',
            avatar: doc.avatar || defaultAvatar,
            rating: doc.rating || '4.9',
            bio: doc.bio || 'Compassionate healthcare professional dedicated to excellence in patient treatment and diagnosis.',
            experience: doc.experience || '10+ Years',
            consultationFee: Number(doc.consultationFee) || 0,
            followUpFee: Number(doc.followUpFee) || 0,
            isPublished: Boolean(doc.isPublished),
            createdAt: doc.createdAt,
        }));
    }

    async setDoctorVisibility(id: string, isPublished: boolean) {
        const repo = this.databaseService.repoDoctor();
        const doctor = await repo.findOne({ where: { id } });
        if (!doctor) {
            throw new NotFoundException(`Doctor with ID ${id} not found`);
        }
        doctor.isPublished = Boolean(isPublished);
        await repo.save(doctor);
        return {
            id: doctor.id,
            name: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
            isPublished: doctor.isPublished,
            message: `Doctor ${doctor.isPublished ? 'is now visible on' : 'has been hidden from'} the public landing page.`,
        };
    }

    async updateDoctorLandingProfile(
        id: string,
        dto: {
            avatar?: string;
            bio?: string;
            experience?: string;
            rating?: string;
            department?: string;
            specialization?: string;
            consultationFee?: number;
            degree?: string;
        },
    ) {
        const repo = this.databaseService.repoDoctor();
        const doctor = await repo.findOne({ where: { id } });
        if (!doctor) {
            throw new NotFoundException(`Doctor with ID ${id} not found`);
        }

        if (dto.avatar !== undefined) doctor.avatar = dto.avatar;
        if (dto.bio !== undefined) doctor.bio = dto.bio;
        if (dto.experience !== undefined) doctor.experience = dto.experience;
        if (dto.rating !== undefined) doctor.rating = dto.rating;
        if (dto.department !== undefined) doctor.department = dto.department;
        if (dto.specialization !== undefined) doctor.specialization = dto.specialization;
        if (dto.consultationFee !== undefined) doctor.consultationFee = Number(dto.consultationFee);
        if (dto.degree !== undefined) doctor.degree = dto.degree;

        await repo.save(doctor);
        return {
            id: doctor.id,
            name: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
            doctor,
            message: 'Doctor public profile updated successfully.',
        };
    }

    async updateDoctorOrder(doctorIds: string[]) {
        const repo = this.databaseService.repoLandingContent();
        let content = await repo.findOne({ where: { id: 'default' } });
        if (!content) {
            content = repo.create({ id: 'default' });
        }
        content.doctorSettings = {
            ...content.doctorSettings,
            order: doctorIds,
        };
        await repo.save(content);
        return {
            order: doctorIds,
            message: 'Doctor display order updated successfully.',
        };
    }
}
