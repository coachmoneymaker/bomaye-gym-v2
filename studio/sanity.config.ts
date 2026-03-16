import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

// Singleton document IDs — one document per type, never duplicated
const SINGLETONS = [
  {id: 'siteSettings', title: 'Site Settings', icon: '⚙️'},
  {id: 'homepage', title: 'Homepage', icon: '🏠'},
  {id: 'pricing', title: 'Pricing', icon: '💰'},
  {id: 'familyBenefit', title: 'Family Benefit', icon: '👨‍👩‍👧'},
  {id: 'corporateBoxing', title: 'Corporate Boxing', icon: '🏢'},
]

// Singleton type names (used to hide "Create new" from list views)
const SINGLETON_TYPES = new Set(SINGLETONS.map((s) => s.id))

export default defineConfig({
  name: 'bomaye-gym',
  title: 'Bomaye Gym Munich',

  // TODO: Replace with your actual Sanity project ID from sanity.io/manage
  projectId: 'REPLACE_WITH_PROJECT_ID',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Bomaye Gym Content')
          .items([
            // ── Site-wide settings ─────────────────────────────────
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('Site Settings'),
              ),

            S.divider(),

            // ── Homepage ───────────────────────────────────────────
            S.listItem()
              .title('Homepage')
              .id('homepage')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage')
                  .title('Homepage'),
              ),

            S.divider(),

            // ── Pricing & Memberships ──────────────────────────────
            S.listItem()
              .title('Pricing')
              .id('pricing')
              .child(
                S.document()
                  .schemaType('pricing')
                  .documentId('pricing')
                  .title('Pricing'),
              ),

            S.divider(),

            // ── Special Modules ────────────────────────────────────
            S.listItem()
              .title('Family Benefit')
              .id('familyBenefit')
              .child(
                S.document()
                  .schemaType('familyBenefit')
                  .documentId('familyBenefit')
                  .title('Family Benefit'),
              ),

            S.listItem()
              .title('Corporate Boxing')
              .id('corporateBoxing')
              .child(
                S.document()
                  .schemaType('corporateBoxing')
                  .documentId('corporateBoxing')
                  .title('Corporate Boxing'),
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Prevent "Create new document" from appearing for singleton types
    templates: (templates) =>
      templates.filter(({schemaType}) => !SINGLETON_TYPES.has(schemaType)),
  },
})
