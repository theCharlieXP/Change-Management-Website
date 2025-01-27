import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Digital Transformation',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Organizational Change',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Process Improvement',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Culture & Leadership',
      },
    }),
  ])

  // Create insights
  await Promise.all([
    prisma.insight.create({
      data: {
        title: 'Cloud Migration Success Story: Global Tech Corp',
        summary: 'Learn how a Fortune 500 company successfully migrated their legacy systems to cloud infrastructure.',
        content: `A Fortune 500 technology company embarked on an ambitious cloud migration project to modernize their infrastructure and improve operational efficiency. This case study explores their journey, challenges faced, and lessons learned.

Key Achievements:
- 40% improvement in system efficiency
- 25% reduction in operational costs
- Zero downtime during migration
- Enhanced scalability and reliability

The project was completed in phases over 18 months, with careful consideration given to employee training, data security, and business continuity. The company's approach to change management and stakeholder communication proved crucial to the project's success.`,
        categoryId: categories[0].id,
        tags: ['Cloud Migration', 'Digital Transformation', 'Technology', 'Infrastructure'],
        readTime: 12,
        source: 'Internal Case Study',
      },
    }),
    prisma.insight.create({
      data: {
        title: 'Hybrid Work Model Implementation at Financial Services Firm',
        summary: 'Discover how a leading financial services company successfully transitioned to a hybrid work model.',
        content: `This case study examines how a major financial services firm with over 10,000 employees successfully implemented a hybrid work model in response to changing workplace dynamics.

Key Outcomes:
- 30% increase in employee satisfaction
- 20% reduction in real estate costs
- Improved work-life balance
- Enhanced productivity metrics

The transition involved significant changes to company culture, technology infrastructure, and management practices. The firm's systematic approach to change management ensured a smooth transition while maintaining high levels of client service.`,
        categoryId: categories[1].id,
        tags: ['Hybrid Work', 'Organizational Change', 'Employee Experience', 'Culture'],
        readTime: 15,
        source: 'Industry Report',
      },
    }),
    prisma.insight.create({
      data: {
        title: "Healthcare Provider's Digital Patient Experience Transformation",
        summary: 'An in-depth analysis of how a major healthcare provider modernized their patient management system.',
        content: `This case study explores how a leading healthcare provider transformed their patient experience through digital innovation while ensuring minimal disruption to critical services.

Key Results:
- 50% reduction in patient wait times
- 35% improvement in patient satisfaction scores
- Streamlined administrative processes
- Enhanced data security and compliance

The transformation included the implementation of a new patient portal, mobile app, and integrated health records system. The provider's approach to change management focused on both staff training and patient education.`,
        categoryId: categories[0].id,
        tags: ['Healthcare', 'Digital Transformation', 'Patient Experience', 'Technology'],
        readTime: 18,
        source: 'Healthcare Innovation Report',
      },
    }),
  ])

  console.log('Database has been seeded! 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 