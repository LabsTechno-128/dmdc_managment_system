export const DEFAULT_LANDING_CONTENT = {
    hero: {
        badge: 'Modern Diagnostic & Healthcare Center',
        title: 'Serving Your Health Needs Is Our',
        highlightText: 'Priority',
        subtitle: 'Experience world-class medical care with state-of-the-art diagnostic facilities and compassionate experts dedicated to your well-being.',
        ctaButtonText: 'Make Appointment',
        secondaryButtonText: 'Learn More',
        emergencyBadgeNumber: '24/7',
        emergencyBadgeText: 'Emergency Care',
        doctorCardName: 'Dr. Anna Lindemann',
        doctorCardRole: 'General Practitioner',
        heroImage: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=800&h=900'
    },
    about: {
        tag: 'Why Choose Us',
        title: 'We Are Committed To Delivering The Best Medical Care',
        description: 'Our state-of-the-art facility combines cutting-edge medical technology with compassionate care to provide you with the most accurate diagnostics and effective treatments available.',
        reasons: [
            'World-class medical equipment and facilities',
            'Highly qualified and experienced specialists',
            '24/7 Emergency care and support',
            'Seamless online booking and consultation',
            'Accurate and fast diagnostic results',
            'Patient-centric approach to healthcare'
        ],
        badgeTitle: 'Fast Response',
        badgeText: 'Ambulance arrives in under 15 mins',
        ctaText: 'Learn More About Us',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&h=900'
    },
    services: {
        title: 'Core Medical Services',
        subtitle: 'We offer a wide range of diagnostic and healthcare services tailored to meet your unique needs with precision and care.',
        items: [
            {
                id: 'covid-test',
                title: 'Covid-19 Test',
                description: 'Fast and reliable PCR and rapid antigen testing with quick result delivery.',
                icon: 'Activity',
                bgColor: 'bg-orange-50',
                iconBg: 'bg-orange-100',
                linkUrl: '#appointment'
            },
            {
                id: 'online-consultation',
                title: 'Online Consultation',
                description: 'Connect with our specialists from the comfort of your home via video call.',
                icon: 'Stethoscope',
                bgColor: 'bg-blue-50',
                iconBg: 'bg-blue-100',
                linkUrl: '#doctors'
            },
            {
                id: 'buy-medicine',
                title: 'Buy Medicine',
                description: 'Order prescribed medicines online with fast home delivery service.',
                icon: 'Pill',
                bgColor: 'bg-green-50',
                iconBg: 'bg-green-100',
                linkUrl: '#contact'
            },
            {
                id: 'checkup-booking',
                title: 'Check-up Booking',
                description: 'Schedule comprehensive health check-ups and radiology services easily.',
                icon: 'HeartPulse',
                bgColor: 'bg-purple-50',
                iconBg: 'bg-purple-100',
                linkUrl: '#appointment'
            }
        ]
    },
    stats: {
        items: [
            { value: '2,500+', label: 'Happy Patients' },
            { value: '16+', label: 'Lab Rooms' },
            { value: '40+', label: 'Specialist Doctors' },
            { value: '1,750+', label: 'Diagnostic Equipments' }
        ]
    },
    articles: {
        title: 'Latest Health News & Tips',
        subtitle: 'Stay informed with our latest articles on health, wellness, and medical advancements.',
        items: [
            {
                id: '1',
                title: '10 Foods to Keep Your Heart Healthy',
                category: 'Diet & Nutrition',
                image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600&h=400',
                date: 'Oct 12, 2026',
                author: 'Dr. Sarah J.',
                linkUrl: '#'
            },
            {
                id: '2',
                title: 'Understanding Your Blood Test Results',
                category: 'Diagnostics',
                image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600&h=400',
                date: 'Oct 10, 2026',
                author: 'Admin',
                linkUrl: '#'
            },
            {
                id: '3',
                title: 'How to Manage Stress During Work',
                category: 'Mental Health',
                image: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=600&h=400',
                date: 'Oct 08, 2026',
                author: 'Dr. Michael C.',
                linkUrl: '#'
            },
            {
                id: '4',
                title: 'The Importance of Annual Check-ups',
                category: 'Preventive Care',
                image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=600&h=400',
                date: 'Oct 05, 2026',
                author: 'Dr. Emily W.',
                linkUrl: '#'
            }
        ]
    },
    contact: {
        centerName: 'Dr. Muazzam Medical Diagnostic Center',
        shortName: 'DMDC',
        description: 'Providing world-class healthcare and accurate diagnostics. Your health and well-being are our top priorities.',
        address: '123 Health Avenue, Medical District, NY 10001',
        phone: '+1 (555) 123-4567',
        email: 'contact@dmdc.com',
        emergencyNote: 'Emergency Only',
        openingHours: [
            { days: 'Monday - Friday', hours: '8:00 AM - 8:00 PM', isEmergency: false },
            { days: 'Saturday', hours: '9:00 AM - 6:00 PM', isEmergency: false },
            { days: 'Sunday', hours: 'Emergency Only', isEmergency: true }
        ],
        socialLinks: {
            facebook: 'https://facebook.com/dmdchealth',
            twitter: 'https://twitter.com/dmdchealth',
            instagram: 'https://instagram.com/dmdchealth',
            linkedin: 'https://linkedin.com/company/dmdchealth'
        },
        copyrightText: 'DMDC. All rights reserved.'
    },
    seo: {
        metaTitle: 'Dr. Muazzam Medical Diagnostic Center (DMDC) | World-Class Healthcare & Diagnostics',
        metaDescription: 'Experience world-class healthcare, fast and accurate diagnostics, specialist doctor consultations, and 24/7 emergency care at DMDC.',
        canonicalUrl: 'http://localhost:5173',
        keywords: 'diagnostic center, hospital, medical care, doctor appointment, health checkup, blood test, cardiology, radiology',
        robots: 'index, follow',
        ogTitle: 'Dr. Muazzam Medical Diagnostic Center (DMDC)',
        ogDescription: 'Serving Your Health Needs Is Our Priority. Modern diagnostics and expert medical consultations.',
        ogImage: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=1200&h=630',
        ogType: 'website',
        twitterCard: 'summary_large_image',
        twitterSite: '@dmdchealth',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'MedicalClinic',
            'name': 'Dr. Muazzam Medical Diagnostic Center (DMDC)',
            'description': 'Modern diagnostic and healthcare center providing specialized consultations, medical tests, and 24/7 emergency care.',
            'url': 'http://localhost:5173',
            'logo': 'http://localhost:5173/logo.jpeg',
            'image': 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=1200&h=630',
            'telephone': '+1-555-123-4567',
            'email': 'contact@dmdc.com',
            'address': {
                '@type': 'PostalAddress',
                'streetAddress': '123 Health Avenue, Medical District',
                'addressLocality': 'New York',
                'addressRegion': 'NY',
                'postalCode': '10001',
                'addressCountry': 'US'
            },
            'openingHoursSpecification': [
                {
                    '@type': 'OpeningHoursSpecification',
                    'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'opens': '08:00',
                    'closes': '20:00'
                },
                {
                    '@type': 'OpeningHoursSpecification',
                    'dayOfWeek': ['Saturday'],
                    'opens': '09:00',
                    'closes': '18:00'
                }
            ],
            'availableService': [
                { '@type': 'MedicalProcedure', 'name': 'Covid-19 PCR & Antigen Testing' },
                { '@type': 'MedicalProcedure', 'name': 'Specialist Doctor Consultation' },
                { '@type': 'MedicalProcedure', 'name': 'Radiology & Imaging Services' },
                { '@type': 'MedicalProcedure', 'name': 'Comprehensive Health Check-up' }
            ]
        }
    },
    sectionVisibility: {
        hero: true,
        services: true,
        about: true,
        stats: true,
        doctors: true,
        articles: true,
        appointment: true
    }
};

export const INITIAL_DOCTORS = [
    {
        firstName: 'Sarah',
        lastName: 'Jenkins',
        specialization: 'Cardiologist',
        degree: 'MD, FACC - Harvard Medical School',
        availability: 'Mon - Fri (09:00 AM - 05:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=500',
        bio: 'Senior consultant cardiologist specializing in cardiovascular wellness, echocardiography, and preventive heart care with over 15 years of clinical practice.',
        rating: '4.9',
        department: 'Cardiology',
        experience: '15+ Years',
        consultationFee: 100,
        followUpFee: 50,
        isPublished: true
    },
    {
        firstName: 'Michael',
        lastName: 'Chen',
        specialization: 'Neurologist',
        degree: 'MD, PhD - Johns Hopkins University',
        availability: 'Mon - Thu (10:00 AM - 04:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=500',
        bio: 'Expert neurologist focused on neuro-diagnostics, headache management, stroke rehabilitation, and movement disorders.',
        rating: '4.8',
        department: 'Neurology',
        experience: '12+ Years',
        consultationFee: 120,
        followUpFee: 60,
        isPublished: true
    },
    {
        firstName: 'Emily',
        lastName: 'Watson',
        specialization: 'Pediatrician',
        degree: 'MD, FAAP - Stanford University',
        availability: 'Mon - Sat (09:00 AM - 03:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1594824436998-d8ea05152823?auto=format&fit=crop&q=80&w=400&h=500',
        bio: 'Compassionate pediatric specialist caring for child development, infant wellness, and adolescent medicine in a friendly environment.',
        rating: '5.0',
        department: 'Pediatrics',
        experience: '10+ Years',
        consultationFee: 90,
        followUpFee: 45,
        isPublished: true
    },
    {
        firstName: 'James',
        lastName: 'Martinez',
        specialization: 'Orthopedic Surgeon',
        degree: 'MS, FRCS - Oxford University',
        availability: 'Tue - Sat (10:00 AM - 06:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=500',
        bio: 'Board-certified orthopedic surgeon with special interest in joint preservation, sports injuries, and minimally invasive procedures.',
        rating: '4.9',
        department: 'Orthopedics',
        experience: '14+ Years',
        consultationFee: 110,
        followUpFee: 55,
        isPublished: true
    },
    {
        firstName: 'Anna',
        lastName: 'Lindemann',
        specialization: 'General Practitioner',
        degree: 'MD - Charité Berlin',
        availability: 'Mon - Fri (08:00 AM - 06:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=800&h=900',
        bio: 'Lead primary care physician providing holistic diagnostics, preventive health evaluations, and general medical care.',
        rating: '4.9',
        department: 'General Medicine',
        experience: '11+ Years',
        consultationFee: 80,
        followUpFee: 40,
        isPublished: true
    }
];
