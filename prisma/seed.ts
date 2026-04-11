import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  // ===== USERS =====
  const rahim = await prisma.users.upsert({
    where: { email: 'rahim@test.com' },
    update: { passwordHash: '$2b$10$U.Ty.u5IbB7VprQ0Pv8xJ.AgtfHt5fdpA.uvf7FqYWA4OPftqnsQq', isVerified: true },
    create: {
      email: 'rahim@test.com',
      passwordHash: '$2b$10$U.Ty.u5IbB7VprQ0Pv8xJ.AgtfHt5fdpA.uvf7FqYWA4OPftqnsQq',
      accountType: 'researcher',
      displayName: 'Dr. Rahim Uddin',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      isVerified: true,
    }
  })

  const nusrat = await prisma.users.upsert({
    where: { email: 'nusrat@test.com' },
    update: {},
    create: {
      email: 'nusrat@test.com',
      passwordHash: 'placeholder',
      accountType: 'researcher',
      displayName: 'Nusrat Jahan',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      isVerified: true,
    }
  })

  const kamal = await prisma.users.upsert({
    where: { email: 'kamal@test.com' },
    update: {},
    create: {
      email: 'kamal@test.com',
      passwordHash: 'placeholder',
      accountType: 'researcher',
      displayName: 'Prof. Kamal Hossain',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      isVerified: true,
    }
  })

  const greenbd = await prisma.users.upsert({
    where: { email: 'greenbd@test.com' },
    update: {},
    create: {
      email: 'greenbd@test.com',
      passwordHash: 'placeholder',
      accountType: 'funding_agency',
      displayName: 'GreenBD Foundation',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      isVerified: true,
    }
  })

  // ===== POSTS =====
  await prisma.posts.createMany({
    skipDuplicates: true,
    data: [
      {
        authorId: rahim.id,
        postType: 'collaboration',
        title: 'Looking for collaborators on climate change impact study in Bangladesh',
        visibility: 'public',
      },
      {
        authorId: nusrat.id,
        postType: 'help',
        title: 'Need help with statistical analysis for my thesis on water quality',
        visibility: 'public',
      },
      {
        authorId: kamal.id,
        postType: 'finished_work',
        title: 'Published: Machine learning approach to crop yield prediction',
        visibility: 'public',
      },
      {
        authorId: greenbd.id,
        postType: 'funding_opportunity',
        title: 'Funding available for renewable energy research projects',
        visibility: 'public',
      },
    ]
  })

  // ===== FIELDS =====
  const csField = await prisma.fields.upsert({
    where: { name: 'Computer Science' },
    update: {},
    create: {
      name: 'Computer Science',
      description: 'Study of computation, algorithms, and information systems',
    }
  })

  const envField = await prisma.fields.upsert({
    where: { name: 'Environmental Science' },
    update: {},
    create: {
      name: 'Environmental Science',
      description: 'Study of environment and solutions to environmental problems',
    }
  })

  const agriField = await prisma.fields.upsert({
    where: { name: 'Agricultural Science' },
    update: {},
    create: {
      name: 'Agricultural Science',
      description: 'Study of farming, food production, and rural development',
    }
  })

  // ===== SUBFIELDS =====
  const mlSubfield = await prisma.subfields.upsert({
    where: { id: 'subfield-ml' },
    update: {},
    create: {
      id: 'subfield-ml',
      fieldId: csField.id,
      name: 'Machine Learning',
      description: 'Algorithms that learn from data',
    }
  })

  const climateSubfield = await prisma.subfields.upsert({
    where: { id: 'subfield-climate' },
    update: {},
    create: {
      id: 'subfield-climate',
      fieldId: envField.id,
      name: 'Climate Change',
      description: 'Study of long-term shifts in global temperatures and weather patterns',
    }
  })

  const cropSubfield = await prisma.subfields.upsert({
    where: { id: 'subfield-crop' },
    update: {},
    create: {
      id: 'subfield-crop',
      fieldId: agriField.id,
      name: 'Crop Science',
      description: 'Study of crop production and improvement',
    }
  })

  // ===== PROBLEMS =====
  const problem001 = await prisma.problems.upsert({
    where: { id: 'problem-001' },
    update: {},
    create: {
      id: 'problem-001',
      subfieldId: mlSubfield.id,
      title: 'Bengali Natural Language Processing',
      description: 'Bengali is spoken by 230 million people yet remains severely underrepresented in NLP research. Most models perform poorly on Bengali text.',
      urgencyLevel: 'moderate',
      coverImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      country: 'Bangladesh',
    }
  })

  const problem002 = await prisma.problems.upsert({
    where: { id: 'problem-002' },
    update: {},
    create: {
      id: 'problem-002',
      subfieldId: climateSubfield.id,
      title: 'Coastal Erosion in Bangladesh',
      description: 'Bangladesh loses significant landmass every year due to coastal erosion, displacing millions and threatening the Sundarbans mangrove forest.',
      urgencyLevel: 'critical',
      coverImageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
      country: 'Bangladesh',
    }
  })

  const problem003 = await prisma.problems.upsert({
    where: { id: 'problem-003' },
    update: {},
    create: {
      id: 'problem-003',
      subfieldId: cropSubfield.id,
      title: 'Rice Yield Stagnation Under Climate Change',
      description: 'Rising temperatures are causing rice yields to plateau, threatening food security for Bangladesh which depends heavily on rice production.',
      urgencyLevel: 'critical',
      coverImageUrl: 'https://images.unsplash.com/photo-1536054600891-399d8aa4e774?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536054600891-399d8aa4e774?w=400',
      country: 'Bangladesh',
    }
  })

  const problem004 = await prisma.problems.upsert({
    where: { id: 'problem-004' },
    update: {},
    create: {
      id: 'problem-004',
      subfieldId: mlSubfield.id,
      title: 'Medical Imaging AI for South Asian Populations',
      description: 'AI diagnostic tools trained on Western datasets perform poorly on South Asian patients due to dataset bias, leading to misdiagnosis.',
      urgencyLevel: 'moderate',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
      country: 'Bangladesh',
    }
  })

  const problem005 = await prisma.problems.upsert({
    where: { id: 'problem-005' },
    update: {},
    create: {
      id: 'problem-005',
      subfieldId: climateSubfield.id,
      title: 'Arsenic Contamination in Groundwater',
      description: 'Millions of Bangladeshis drink arsenic-contaminated groundwater daily, causing chronic poisoning with no affordable large-scale solution yet.',
      urgencyLevel: 'critical',
      coverImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      country: 'Bangladesh',
    }
  })

  // ===== PROBLEM APPLICABLE FIELDS =====
  await prisma.problem_applicable_fields.createMany({
    skipDuplicates: true,
    data: [
      // ── Problem 001: Bengali NLP ──
      {
        problemId: problem001.id,
        fieldId: csField.id,
        howThisFieldHelps: 'NLP model architecture, transformer fine-tuning, tokenizer design, and benchmark creation for low-resource languages.',
        relevantTechniques: 'Transfer learning, multilingual transformers (mBERT, XLM-R), data augmentation, active learning for annotation',
        openResearchQuestions: 'Can synthetic data generation close the gap for low-resource Bengali NLP? How do morphologically rich languages affect tokenizer design?',
      },

      // ── Problem 002: Coastal erosion — 3 fields can help ──
      {
        problemId: problem002.id,
        fieldId: envField.id,
        howThisFieldHelps: 'Climate modeling, coastal geomorphology, mangrove ecosystem restoration, and sea level rise projections.',
        relevantTechniques: 'GIS mapping, sediment transport modeling, mangrove replanting protocols, tidal gauge analysis',
        openResearchQuestions: 'What is the tipping point for Sundarbans mangrove collapse? Can engineered wetlands replace natural barriers?',
      },
      {
        problemId: problem002.id,
        fieldId: csField.id,
        howThisFieldHelps: 'Satellite image analysis for erosion tracking, ML-based flood prediction models, early warning system software.',
        relevantTechniques: 'Remote sensing with CNNs, time-series forecasting (LSTM), real-time sensor data pipelines',
        openResearchQuestions: 'Can satellite imagery predict erosion hotspots 5-10 years in advance? How accurate are ML flood models for deltaic regions?',
      },
      {
        problemId: problem002.id,
        fieldId: agriField.id,
        howThisFieldHelps: 'Salt-tolerant crop varieties for affected regions, soil science for understanding land degradation patterns.',
        relevantTechniques: 'Saline agriculture, floating garden cultivation, soil salinity mapping',
        openResearchQuestions: 'Can floating agriculture scale to feed displaced coastal populations?',
      },

      // ── Problem 003: Rice yield stagnation ──
      {
        problemId: problem003.id,
        fieldId: agriField.id,
        howThisFieldHelps: 'Heat-tolerant rice breeding, crop management practices, irrigation optimization for temperature control.',
        relevantTechniques: 'Speed breeding, marker-assisted selection, deficit irrigation, crop microclimate management',
        openResearchQuestions: 'Can CRISPR-edited heat tolerance genes be deployed in Bangladesh rice varieties within regulatory frameworks?',
      },
      {
        problemId: problem003.id,
        fieldId: csField.id,
        howThisFieldHelps: 'Precision agriculture using drone imagery, yield prediction models, and weather-crop interaction simulations.',
        relevantTechniques: 'Computer vision for crop stress detection, random forest yield prediction, IoT soil sensors',
        openResearchQuestions: 'Can low-cost smartphone-based crop monitoring replace expensive drone systems for smallholder farmers?',
      },

      // ── Problem 004: Medical imaging AI ──
      {
        problemId: problem004.id,
        fieldId: csField.id,
        howThisFieldHelps: 'Building South Asian medical imaging datasets, fine-tuning diagnostic models, federated learning across hospitals.',
        relevantTechniques: 'Transfer learning on medical images, federated learning, data augmentation for medical scans, explainable AI',
        openResearchQuestions: 'How much South Asian training data is needed to match Western-trained model accuracy? Can federated learning solve privacy concerns?',
      },

      // ── Problem 005: Arsenic contamination ──
      {
        problemId: problem005.id,
        fieldId: envField.id,
        howThisFieldHelps: 'Hydrogeology of arsenic mobilization, water treatment chemistry, community-scale filtration system design.',
        relevantTechniques: 'Iron oxide adsorption, electrocoagulation, aquifer mapping, groundwater flow modeling',
        openResearchQuestions: 'Why do arsenic levels vary so dramatically between neighboring wells? Can we predict safe aquifer zones without drilling?',
      },
      {
        problemId: problem005.id,
        fieldId: csField.id,
        howThisFieldHelps: 'Geospatial prediction of arsenic hotspots, mobile apps for village-level water testing data collection.',
        relevantTechniques: 'Spatial interpolation (kriging), classification models for well safety, crowdsourced data platforms',
        openResearchQuestions: 'Can ML models predict arsenic concentration from geological features alone, eliminating the need for chemical testing of every well?',
      },
    ]
  })

  console.log('Seed complete!')
}

main()
  .catch(function(e) {
    console.error(e)
    process.exit(1)
  })
  .finally(async function() {
    await prisma.$disconnect()
  })