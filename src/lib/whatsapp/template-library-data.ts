export type TemplateIndustry =
  | 'ecommerce'
  | 'education'
  | 'healthcare'
  | 'real-estate'
  | 'finance'
  | 'it-services'
  | 'events'
  | 'automotive';

export type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication';

export interface LibraryTemplate {
  id: string;
  name: string;
  industry: TemplateIndustry;
  category: TemplateCategory;
  language: string;
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  body_text: string;
  footer_text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  sample_values?: {
    body: string[];
  };
}

export const INDUSTRIES: { id: TemplateIndustry; label: string; description: string }[] = [
  { id: 'ecommerce', label: 'E-commerce', description: 'Order updates, abandoned cart, promotions' },
  { id: 'education', label: 'Education', description: 'Class reminders, enrollment, progress' },
  { id: 'healthcare', label: 'Healthcare', description: 'Appointment reminders, reports, follow-ups' },
  { id: 'real-estate', label: 'Real Estate', description: 'Property tours, inquiries, follow-ups' },
  { id: 'finance', label: 'Finance & Insurance', description: 'Payment reminders, policy updates, claims' },
  { id: 'it-services', label: 'IT Services', description: 'Support tickets, service updates, invoices' },
  { id: 'events', label: 'Events & Webinars', description: 'Registration, reminders, feedback' },
  { id: 'automotive', label: 'Automotive', description: 'Test drives, service reminders, offers' },
];

export const LIBRARY_TEMPLATES: LibraryTemplate[] = [
  {
    id: 'ecom-order-confirmation',
    name: 'order_confirmation',
    industry: 'ecommerce',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Order Confirmed! 🎉',
    body_text: 'Hi {{1}},\n\nYour order #{{2}} has been confirmed!\n\n📦 Items: {{3}}\n💰 Total: {{4}}\n📍 Delivery: {{5}}\n\nWe\'ll update you when it ships.',
    footer_text: 'Thank you for shopping with us',
    buttons: [
      { type: 'URL', text: 'Track Order', url: 'https://example.com/orders/{{1}}' },
    ],
    sample_values: { body: ['John', 'ORD-12345', 'Wireless Headphones, USB Cable', '$49.99', '2-4 business days'] },
  },
  {
    id: 'ecom-abandoned-cart',
    name: 'abandoned_cart_reminder',
    industry: 'ecommerce',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: 'You left something behind! 🛒',
    body_text: 'Hi {{1}},\n\nYou have items waiting in your cart:\n\n{{2}}\n\nComplete your purchase now and get {{3}} off!',
    footer_text: 'Offer expires in 24 hours',
    buttons: [
      { type: 'URL', text: 'View Cart', url: 'https://example.com/cart' },
      { type: 'URL', text: 'Shop More', url: 'https://example.com' },
    ],
    sample_values: { body: ['Sarah', '• Wireless Headphones\n• Phone Case\n• Screen Protector', '10%'] },
  },
  {
    id: 'ecom-shipping-update',
    name: 'shipping_update',
    industry: 'ecommerce',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Your package is on the way! 🚚',
    body_text: 'Hi {{1}},\n\nYour order #{{2}} has been shipped!\n\n📦 Carrier: {{3}}\n🔗 Tracking: {{4}}\n📍 Est. delivery: {{5}}',
    footer_text: 'Need help? Reply to this message',
    buttons: [
      { type: 'URL', text: 'Track Package', url: 'https://example.com/track/{{1}}' },
    ],
    sample_values: { body: ['Mike', 'ORD-67890', 'FedEx', '1Z999AA10123456784', 'March 15-18'] },
  },
  {
    id: 'ecom-delivery-confirmed',
    name: 'delivery_confirmed',
    industry: 'ecommerce',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour order #{{2}} has been delivered! ✅\n\nWe hope you love your purchase. Leave a review and get {{3}} off your next order!',
    footer_text: 'Rate your experience',
    buttons: [
      { type: 'URL', text: 'Leave a Review', url: 'https://example.com/review/{{1}}' },
      { type: 'QUICK_REPLY', text: 'Need Help?' },
    ],
    sample_values: { body: ['Emma', 'ORD-11223', '15%'] },
  },
  {
    id: 'ecom-promotional',
    name: 'flash_sale_alert',
    industry: 'ecommerce',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: '⚡ Flash Sale Alert! ⚡',
    body_text: 'Hi {{1}},\n\nOur flash sale is LIVE! 🎉\n\n🔥 Up to {{2}} off on {{3}}\n⏰ Only {{4}} hours left!\n\nDon\'t miss out on these amazing deals.',
    buttons: [
      { type: 'URL', text: 'Shop Now', url: 'https://example.com/sale' },
    ],
    sample_values: { body: ['Alex', '70%', 'electronics & accessories', '12'] },
  },
  {
    id: 'ecom-order-ready',
    name: 'order_ready_pickup',
    industry: 'ecommerce',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour order #{{2}} is ready for pickup! 🎉\n\n📍 Pickup at: {{3}}\n🕐 Available until: {{4}}\n\nPlease bring your order confirmation.',
    buttons: [
      { type: 'URL', text: 'Get Directions', url: 'https://maps.example.com/{{1}}' },
    ],
    sample_values: { body: ['David', 'ORD-44556', '123 Main Street, Store #5', 'Today at 8 PM'] },
  },
  {
    id: 'edu-class-reminder',
    name: 'class_reminder',
    industry: 'education',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '📚 Class Reminder',
    body_text: 'Hi {{1}},\n\nThis is a reminder for your upcoming class:\n\n📖 Course: {{2}}\n🕐 Time: {{3}}\n📍 Location: {{4}}\n👨‍🏫 Instructor: {{5}}',
    footer_text: 'Attendance is mandatory',
    buttons: [
      { type: 'URL', text: 'Join Class', url: 'https://example.com/join/{{1}}' },
    ],
    sample_values: { body: ['Student', 'Advanced Mathematics', '10:00 AM - 11:30 AM', 'Room 201', 'Dr. Smith'] },
  },
  {
    id: 'edu-enrollment',
    name: 'enrollment_confirmation',
    industry: 'education',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🎓 Enrollment Confirmed!',
    body_text: 'Hi {{1}},\n\nYou\'re enrolled in {{2}}!\n\n📅 Start Date: {{3}}\n⏰ Schedule: {{4}}\n💰 Amount Paid: {{5}}\n\nWelcome aboard! 🎉',
    buttons: [
      { type: 'URL', text: 'View Schedule', url: 'https://example.com/schedule' },
    ],
    sample_values: { body: ['John', 'Web Development Bootcamp', 'April 1, 2026', 'Mon/Wed/Fri 6-9 PM', '$1,299'] },
  },
  {
    id: 'edu-exam-schedule',
    name: 'exam_schedule',
    industry: 'education',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour exam schedule is here:\n\n📝 {{2}}\n📅 {{3}}\n⏰ {{4}}\n📍 {{5}}\n\nGood luck! 🍀',
    sample_values: { body: ['Sarah', 'Final Term Exams', 'March 20-25, 2026', '9:00 AM - 12:00 PM', 'Hall A'] },
  },
  {
    id: 'edu-payment-reminder',
    name: 'fee_payment_reminder',
    industry: 'education',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nThis is a reminder for your pending fee:\n\n📋 Fee Type: {{2}}\n💰 Amount: {{3}}\n📅 Due Date: {{4}}\n\nPay now to avoid late fees.',
    buttons: [
      { type: 'URL', text: 'Pay Now', url: 'https://example.com/pay' },
    ],
    sample_values: { body: ['Parent/Student', 'Tuition Fee - Semester 2', '$2,500', 'April 15, 2026'] },
  },
  {
    id: 'edu-promotional',
    name: 'course_promotion',
    industry: 'education',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: '🚀 New Courses Available!',
    body_text: 'Hi {{1}},\n\nUpskill with our new courses:\n\n📚 {{2}}\n💡 {{3}}\n\nGet {{4}} off if you enroll this week!',
    buttons: [
      { type: 'URL', text: 'Explore Courses', url: 'https://example.com/courses' },
    ],
    sample_values: { body: ['Student', 'Data Science, AI, Cloud Computing', 'Industry-recognized certifications', '20%'] },
  },
  {
    id: 'hcare-appointment-reminder',
    name: 'appointment_reminder',
    industry: 'healthcare',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🏥 Appointment Reminder',
    body_text: 'Hi {{1}},\n\nThis is a reminder for your upcoming appointment:\n\n👨‍⚕️ Doctor: {{2}}\n📅 Date: {{3}}\n⏰ Time: {{4}}\n📍 Location: {{5}}',
    footer_text: 'Please arrive 15 minutes early',
    buttons: [
      { type: 'URL', text: 'Reschedule', url: 'https://example.com/reschedule/{{1}}' },
      { type: 'PHONE_NUMBER', text: 'Call Clinic', phone_number: '15551234567' },
    ],
    sample_values: { body: ['Jane', 'Dr. Williams', 'March 15, 2026', '10:30 AM', 'Suite 200, Medical Center'] },
  },
  {
    id: 'hcare-report-ready',
    name: 'lab_report_ready',
    industry: 'healthcare',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour lab reports are ready! 📋\n\nTest: {{2}}\nDate: {{3}}\n\nYou can view them securely online.',
    buttons: [
      { type: 'URL', text: 'View Reports', url: 'https://example.com/reports/{{1}}' },
    ],
    sample_values: { body: ['Robert', 'Complete Blood Count, Lipid Profile', 'March 10, 2026'] },
  },
  {
    id: 'hcare-followup',
    name: 'follow_up_visit',
    industry: 'healthcare',
    category: 'Marketing',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nIt\'s time for your follow-up visit! 🩺\n\nYour last visit was on {{2}}.\nDr. {{3}} recommends scheduling a check-up.',
    buttons: [
      { type: 'URL', text: 'Book Appointment', url: 'https://example.com/book' },
    ],
    sample_values: { body: ['Mary', 'February 28, 2026', 'Johnson'] },
  },
  {
    id: 'hcare-prescription',
    name: 'prescription_reminder',
    industry: 'healthcare',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nMedication Reminder 💊\n\nPrescribed by: Dr. {{2}}\nMedication: {{3}}\nDosage: {{4}}\nRefills remaining: {{5}}',
    sample_values: { body: ['Tom', 'Sarah', 'Amoxicillin 500mg', '1 capsule 3 times daily', '2 refills'] },
  },
  {
    id: 're-property-tour',
    name: 'property_tour_scheduled',
    industry: 'real-estate',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🏠 Property Tour Confirmed!',
    body_text: 'Hi {{1}},\n\nYour tour is scheduled:\n\n📍 Property: {{2}}\n📅 Date: {{3}}\n⏰ Time: {{4}}\n👤 Agent: {{5}}',
    buttons: [
      { type: 'URL', text: 'View Property Details', url: 'https://example.com/properties/{{1}}' },
      { type: 'PHONE_NUMBER', text: 'Call Agent', phone_number: '15559876543' },
    ],
    sample_values: { body: ['Buyer', '123 Oak Avenue, 3BR/2BA', 'March 16, 2026', '2:00 PM', 'Mike Johnson'] },
  },
  {
    id: 're-new-listing',
    name: 'new_listing_alert',
    industry: 'real-estate',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: 'New Property Listed! 🏡',
    body_text: 'Hi {{1}},\n\nCheck out this new listing:\n\n📍 {{2}}\n💰 {{3}}\n🛏️ {{4}} Beds | 🛁 {{5}} Baths | 📐 {{6}} sqft\n\nSchedule a tour today!',
    buttons: [
      { type: 'URL', text: 'View Listing', url: 'https://example.com/listings/{{1}}' },
    ],
    sample_values: { body: ['Client', '456 Pine Street', '$450,000', '4', '2.5', '2,200'] },
  },
  {
    id: 're-offer-update',
    name: 'offer_status_update',
    industry: 'real-estate',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nUpdate on your offer for {{2}}:\n\n📋 Status: {{3}}\n💰 Offer Amount: {{4}}\n📅 Submitted: {{5}}\n\nYour agent will follow up with details.',
    buttons: [
      { type: 'PHONE_NUMBER', text: 'Call Agent', phone_number: '15559876543' },
    ],
    sample_values: { body: ['Homebuyer', '789 Maple Drive', 'Under Review', '$435,000', 'March 12, 2026'] },
  },
  {
    id: 're-open-house',
    name: 'open_house_invitation',
    industry: 'real-estate',
    category: 'Marketing',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYou\'re invited to our Open House! 🎉\n\n📍 {{2}}\n📅 {{3}}\n⏰ {{4}}\n\nRefreshments provided. Bring your family!',
    buttons: [
      { type: 'URL', text: 'RSVP Now', url: 'https://example.com/rsvp/{{1}}' },
    ],
    sample_values: { body: ['Neighbor', '321 Cedar Lane', 'Saturday, March 22', '11:00 AM - 3:00 PM'] },
  },
  {
    id: 'fin-payment-reminder',
    name: 'payment_reminder',
    industry: 'finance',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '💳 Payment Reminder',
    body_text: 'Hi {{1}},\n\nYour payment is due soon:\n\n📋 Account: {{2}}\n💰 Amount Due: {{3}}\n📅 Due Date: {{4}}\n\nPay on time to avoid late fees.',
    buttons: [
      { type: 'URL', text: 'Pay Now', url: 'https://example.com/pay/{{1}}' },
      { type: 'PHONE_NUMBER', text: 'Contact Support', phone_number: '18005551234' },
    ],
    sample_values: { body: ['Customer', 'XXXX-1234', '$156.00', 'March 20, 2026'] },
  },
  {
    id: 'fin-policy-renewal',
    name: 'policy_renewal',
    industry: 'finance',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour {{2}} policy is up for renewal!\n\n📄 Policy #: {{3}}\n📅 Expires: {{4}}\n💰 Premium: {{5}}\n\nRenew now to stay covered.',
    buttons: [
      { type: 'URL', text: 'Renew Policy', url: 'https://example.com/renew/{{1}}' },
    ],
    sample_values: { body: ['Insured', 'Auto Insurance', 'POL-98765', 'April 1, 2026', '$450/year'] },
  },
  {
    id: 'fin-claim-update',
    name: 'claim_status_update',
    industry: 'finance',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour claim update:\n\n📋 Claim #: {{2}}\n📌 Status: {{3}}\n💵 Amount: {{4}}\n📅 Last Updated: {{5}}',
    buttons: [
      { type: 'URL', text: 'View Details', url: 'https://example.com/claims/{{1}}' },
    ],
    sample_values: { body: ['Claimant', 'CLM-54321', 'Approved - Payment Initiated', '$2,350', 'March 14, 2026'] },
  },
  {
    id: 'it-support-ticket',
    name: 'support_ticket_confirmation',
    industry: 'it-services',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🎫 Ticket Created',
    body_text: 'Hi {{1}},\n\nYour support request has been received:\n\n📋 Ticket #: {{2}}\n📌 Issue: {{3}}\n⚡ Priority: {{4}}\n⏱️ Est. Response: {{5}}',
    buttons: [
      { type: 'URL', text: 'View Ticket', url: 'https://example.com/tickets/{{1}}' },
    ],
    sample_values: { body: ['Client', 'TKT-78901', 'Email not sending - SMTP error', 'High', 'Within 2 hours'] },
  },
  {
    id: 'it-service-update',
    name: 'service_outage_update',
    industry: 'it-services',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nService Update:\n\n🔧 Service: {{2}}\n📌 Status: {{3}}\n⏰ Started: {{4}}\n🔜 ETA: {{5}}\n\nWe apologize for the inconvenience.',
    buttons: [
      { type: 'URL', text: 'Status Page', url: 'https://status.example.com' },
    ],
    sample_values: { body: ['Customer', 'Database Hosting', 'Resolved - All systems normal', '2:30 PM UTC', 'N/A'] },
  },
  {
    id: 'it-invoice',
    name: 'invoice_ready',
    industry: 'it-services',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour invoice is ready:\n\n📄 Invoice #: {{2}}\n💰 Amount: {{3}}\n📅 Due: {{4}}\n📎 Description: {{5}}',
    buttons: [
      { type: 'URL', text: 'View Invoice', url: 'https://example.com/invoices/{{1}}' },
      { type: 'URL', text: 'Pay Now', url: 'https://example.com/pay' },
    ],
    sample_values: { body: ['Business Client', 'INV-33456', '$1,200.00', 'April 5, 2026', 'Web Hosting - March 2026'] },
  },
  {
    id: 'event-registration',
    name: 'event_registration_confirmed',
    industry: 'events',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🎟️ Registration Confirmed!',
    body_text: 'Hi {{1}},\n\nYou\'re registered for {{2}}!\n\n📅 Date: {{3}}\n⏰ Time: {{4}}\n📍 Venue: {{5}}',
    footer_text: 'Your ticket is attached below',
    buttons: [
      { type: 'URL', text: 'Add to Calendar', url: 'https://example.com/calendar/{{1}}' },
    ],
    sample_values: { body: ['Attendee', 'Tech Conference 2026', 'April 10-12, 2026', '9:00 AM - 6:00 PM', 'Convention Center Hall B'] },
  },
  {
    id: 'event-reminder',
    name: 'event_reminder',
    industry: 'events',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nDon\'t forget! 🎉\n\n{{2}} starts in {{3}}!\n\n📅 {{4}}\n⏰ {{5}}',
    buttons: [
      { type: 'URL', text: 'Event Details', url: 'https://example.com/events/{{1}}' },
    ],
    sample_values: { body: ['Attendee', 'Networking Mixer', '2 hours', 'March 18, 2026', '7:00 PM'] },
  },
  {
    id: 'event-feedback',
    name: 'event_feedback',
    industry: 'events',
    category: 'Marketing',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nThanks for attending {{2}}! 🎉\n\nWe\'d love your feedback:\n\nTell us what you thought of {{3}}.',
    buttons: [
      { type: 'URL', text: 'Share Feedback', url: 'https://example.com/feedback/{{1}}' },
      { type: 'QUICK_REPLY', text: 'Loved it!' },
      { type: 'QUICK_REPLY', text: 'Could be better' },
    ],
    sample_values: { body: ['Attendee', 'Design Summit 2026', 'the keynote speaker'] },
  },
  {
    id: 'auto-test-drive',
    name: 'test_drive_confirmed',
    industry: 'automotive',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: '🚗 Test Drive Scheduled!',
    body_text: 'Hi {{1}},\n\nYour test drive is confirmed:\n\n🚘 Vehicle: {{2}}\n📅 Date: {{3}}\n⏰ Time: {{4}}\n📍 Dealership: {{5}}',
    buttons: [
      { type: 'URL', text: 'Get Directions', url: 'https://maps.example.com/{{1}}' },
    ],
    sample_values: { body: ['Customer', '2026 Tesla Model 3', 'March 19, 2026', '11:00 AM', 'Downtown Auto Center'] },
  },
  {
    id: 'auto-service-reminder',
    name: 'service_reminder',
    industry: 'automotive',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour {{2}} is due for service!\n\n🔧 Service: {{3}}\n📅 Last Service: {{4}}\n📌 Mileage: {{5}} miles\n\nBook your appointment today!',
    buttons: [
      { type: 'URL', text: 'Book Service', url: 'https://example.com/service/{{1}}' },
    ],
    sample_values: { body: ['Owner', 'Honda Civic 2022', 'Oil Change & Tire Rotation', 'Jan 15, 2026', '15,000'] },
  },
  {
    id: 'auto-offer',
    name: 'special_offer',
    industry: 'automotive',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: '🔥 Special Offer Just for You!',
    body_text: 'Hi {{1}},\n\nGet {{2}} off on {{3}}!\n\n🏷️ Model: {{4}}\n💰 Price: {{5}}\n\nOffer valid until {{6}}.',
    buttons: [
      { type: 'URL', text: 'View Offer', url: 'https://example.com/offers/{{1}}' },
      { type: 'PHONE_NUMBER', text: 'Call Sales', phone_number: '15551234567' },
    ],
    sample_values: { body: ['Lead', '$2,000', 'select new models', '2026 Toyota Camry', '$28,500', 'March 31'] },
  },
  {
    id: 'auto-service-ready',
    name: 'service_completed',
    industry: 'automotive',
    category: 'Utility',
    language: 'en_US',
    body_text: 'Hi {{1}},\n\nYour {{2}} is ready! ✅\n\n🔧 Service: {{3}}\n💰 Total: {{4}}\n📍 Ready for pickup at: {{5}}',
    buttons: [
      { type: 'URL', text: 'Pay Online', url: 'https://example.com/pay/{{1}}' },
    ],
    sample_values: { body: ['Customer', 'Ford Mustang GT', 'Oil Change + Brake Pad Replacement', '$350', 'Our Service Center'] },
  },
];
