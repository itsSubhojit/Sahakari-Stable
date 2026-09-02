/**
 * Sahakari Worker Mock & Fallback Data
 */

export const mockWorkerProfile = {
  id: "WRK-8821",
  workerId: "WRK-8821",
  coopId: "SAH-COOP-8821",
  name: "Suresh Patel",
  email: "suresh@sahakari.in",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
  primarySkill: "Senior Master Plumber & HVAC Specialist",
  category: "Plumbing",
  rating: 4.9,
  totalReviews: 148,
  totalJobsCompleted: 312,
  acceptanceRate: 94.2,
  coopMemberSince: "January 2022",
  coopTier: "Tier 1 Cooperative Shareholder",
  dividendSharePercent: 2.8,
  dividendEarnedYearToDate: 1420.00,
  isKycVerified: true,
  isInsuranceActive: true,
  insurancePolicyNumber: "SAH-GIG-2026-99182",
  walletBalance: 4850.00,
  status: "ONLINE", // 'ONLINE' | 'BUSY' | 'OFFLINE'
  upiId: "suresh.patel@okhdfcbank",
  cooperativeDistrict: "South Delhi Central Cooperative Federation",
  hourlyRate: 450,
  skills: [
    "Copper Pipe Repair",
    "Emergency Shutoff",
    "Drain Clearing",
    "Pressure Testing",
    "Sanitary Fitting",
    "AC Gas Refills",
    "HVAC Capacitor Diagnostic"
  ]
};

export const initialLeads = [
  {
    id: "REQ-8472",
    title: "Emergency Pipe Repair & Valve Replacement",
    category: "Plumbing",
    categoryIcon: "plumbing",
    distance: "1.2 km away",
    address: "Flat 402, Green Glen Heights, Sector 14, Ring Road",
    verified: true,
    urgency: "EMERGENCY",
    urgencyColor: "error",
    slaSecondsRemaining: 720, // 12 mins
    acceptedByWorker: false,
    aiMode: "OFF", // 'OFF' | 'COPILOT' | 'AUTOPILOT'
    aiDraft: "Hi Ramesh! I've activated my AI assistant. Suresh can be at Flat 402 in 20 minutes with compression fittings and pressure testing tools for ₹450.00 including a 90-day coop warranty.",
    customer: {
      name: "Ramesh Sharma",
      rating: 4.8,
      reviewCount: 34,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Mar 2023",
      completedJobs: 18,
      verifiedPayment: true,
      escrowLocked: true
    },
    jobScope: {
      summary: "Severe copper pipe burst under kitchen sink valve. Water valve currently shut off. Needs immediate replacement of T-joint, pressure test, and sealant.",
      toolsRequired: ["15mm Copper Pipe Cutter", "Compression Fittings", "Teflon Tape", "Basin Wrench"],
      photos: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80",
          caption: "Corroded T-junction and active dripping under sink basin"
        }
      ],
      voiceNote: {
        duration: "0:24",
        transcription: "Hi, water was gushing out from the main T-valve under the sink. We managed to turn the stopcock off, but we have no water in the kitchen now. Please come with replacement parts!"
      },
      preferredTiming: "Immediate (Within 30 mins)",
      accessInstructions: "Guard at Gate 2 will give visitor parking pass. Take elevator B to 4th floor."
    },
    financials: {
      currentPendingOffer: 450.00,
      customerInitialOffer: 400.00,
      workerLastCounter: 500.00,
      coopFeePercent: 3.0, // Sahakari cooperative 3% fee
      estimatedMaterialCost: 80.00
    },
    status: "YOUR_TURN", // 'YOUR_TURN' | 'CUSTOMER_TURN' | 'ACCEPTED' | 'REJECTED'
    thread: [
      {
        id: "msg-1",
        sender: "CUSTOMER",
        senderName: "Ramesh Sharma",
        time: "10:42 AM",
        text: "Initial offer for urgent response. Water is off so need it resolved quickly.",
        amount: 400.00,
        type: "OFFER"
      },
      {
        id: "msg-2",
        sender: "WORKER",
        senderName: "You (Suresh Patel)",
        time: "10:45 AM",
        text: "Requires specialized brass compression fittings and emergency transit. Standard rate is ₹500 including 90-day coop warranty.",
        amount: 500.00,
        type: "COUNTER"
      },
      {
        id: "msg-3",
        sender: "CUSTOMER",
        senderName: "Ramesh Sharma",
        time: "10:48 AM",
        text: "Can we meet at ₹450? I need this done ASAP and will confirm immediately.",
        amount: 450.00,
        type: "COUNTER",
        isPending: true
      }
    ]
  },
  {
    id: "REQ-8480",
    title: "AC Inverter Compressor Diagnostic & Gas Top-up",
    category: "HVAC & Appliances",
    categoryIcon: "mode_fan",
    distance: "2.8 km away",
    address: "Villa 19, Palm Grove Meadows, East Avenue",
    verified: true,
    urgency: "HIGH PRIORITY",
    urgencyColor: "secondary",
    slaSecondsRemaining: 1800, // 30 mins
    acceptedByWorker: false,
    aiMode: "COPILOT",
    aiDraft: "Hi Priya! I can handle the 1.5 Ton Split AC outdoor unit capacitor check and refrigerant gas top-up for ₹550.00. I can be there at 2:00 PM.",
    customer: {
      name: "Priya Nair",
      rating: 4.9,
      reviewCount: 42,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Jan 2023",
      completedJobs: 26,
      verifiedPayment: true,
      escrowLocked: true
    },
    jobScope: {
      summary: "Split AC outdoor fan running but compressor tripping every 2 minutes. Indoor blower throws room temp air. Error code E4 occasionally shown.",
      toolsRequired: ["Digital Clamp Meter", "R32 Gauge Manifold", "45uF Run Dual Capacitor", "Vacuum Pump"],
      photos: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
          caption: "Outdoor condenser unit on 2nd floor balcony"
        }
      ],
      preferredTiming: "Today 2:00 PM – 4:00 PM",
      accessInstructions: "Call from gate security intercom #19."
    },
    financials: {
      currentPendingOffer: 550.00,
      customerInitialOffer: 500.00,
      workerLastCounter: 600.00,
      coopFeePercent: 3.0,
      estimatedMaterialCost: 120.00
    },
    status: "CUSTOMER_TURN",
    thread: [
      {
        id: "msg-8480-1",
        sender: "CUSTOMER",
        senderName: "Priya Nair",
        time: "09:15 AM",
        text: "Looking for diagnostic and fix for AC outdoor unit.",
        amount: 500.00,
        type: "OFFER"
      },
      {
        id: "msg-8480-2",
        sender: "WORKER",
        senderName: "You (Suresh Patel)",
        time: "09:20 AM",
        text: "I will do a complete capacitor & gas pressure test with digital manifold for ₹550.",
        amount: 550.00,
        type: "COUNTER"
      }
    ]
  },
  {
    id: "REQ-8491",
    title: "Main DB Board MCB Tripping & Earthing Check",
    category: "Electrical",
    categoryIcon: "electric_bolt",
    distance: "3.5 km away",
    address: "Tower C, Apartment 1201, Maple Woods",
    verified: true,
    urgency: "STANDARD",
    urgencyColor: "primary",
    slaSecondsRemaining: 3600, // 60 mins
    acceptedByWorker: false,
    aiMode: "OFF",
    aiDraft: "Hi Amit! I can inspect the distribution board, isolate the short circuit branch, and check the earth leakage relay.",
    customer: {
      name: "Amitabh Sen",
      rating: 4.7,
      reviewCount: 15,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Nov 2023",
      completedJobs: 9,
      verifiedPayment: true,
      escrowLocked: false
    },
    jobScope: {
      summary: "32A 4-pole MCB keeps tripping whenever microwave and water heater are turned on together. Neutral line sparking suspected.",
      toolsRequired: ["Megger Insulation Tester", "True RMS Clamp Meter", "Insulated Screwdriver Set 1000V"],
      photos: [],
      preferredTiming: "Tomorrow Morning 10:00 AM",
      accessInstructions: "Visitor parking available in Basement 1."
    },
    financials: {
      currentPendingOffer: 450.00,
      customerInitialOffer: 350.00,
      workerLastCounter: 450.00,
      coopFeePercent: 3.0,
      estimatedMaterialCost: 40.00
    },
    status: "YOUR_TURN",
    thread: [
      {
        id: "msg-8491-1",
        sender: "CUSTOMER",
        senderName: "Amitabh Sen",
        time: "Yesterday 08:30 PM",
        text: "Need someone with insulation tester for DB board diagnostics.",
        amount: 350.00,
        type: "OFFER"
      },
      {
        id: "msg-8491-2",
        sender: "CUSTOMER",
        senderName: "Amitabh Sen",
        time: "Yesterday 08:35 PM",
        text: "Can increase to ₹450 if you can guarantee earthing resistance measurement.",
        amount: 450.00,
        type: "COUNTER",
        isPending: true
      }
    ]
  }
];
