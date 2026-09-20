import 'dotenv/config';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { markPdfOutdated } from '../src/lib/pdf-status';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function readWorkbook(path: string) {
  const workbook = XLSX.readFile(path);
  const masterSheet = workbook.Sheets['Sheet1'];
  const secondarySheet = workbook.Sheets['PRODUCT LIST'];

  if (!masterSheet) {
    throw new Error('Master sheet "Sheet1" not found');
  }

  const masterRows = XLSX.utils.sheet_to_json<{ Name: string; Category: string }>(masterSheet, {
    header: ['sn', 'Name', 'Category'],
    range: 1,
  });

  const masterNames = new Set(masterRows.map(r => r.Name?.trim().toUpperCase()).filter(Boolean));

  let allRows = masterRows.map(r => ({
    name: r.Name?.trim() || '',
    category: r.Category?.trim() || '',
  })).filter(r => r.name && r.category);

  if (secondarySheet) {
    const secondaryRows = XLSX.utils.sheet_to_json<{ Name: string; Category: string }>(secondarySheet, {
      header: ['sn', 'Name', 'Category'],
      range: 1,
    });

    for (const row of secondaryRows) {
      const name = row.Name?.trim();
      const category = row.Category?.trim();
      if (name && category && !masterNames.has(name.toUpperCase())) {
        allRows.push({ name, category });
      }
    }
  }

  const seen = new Set<string>();
  const products: any[] = [];
  for (const row of allRows) {
    const cleanName = row.name.replace(/\s+/g, ' ');
    const key = cleanName.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);

    products.push({
      name: cleanName,
      category: row.category,
      categorySlug: slug(row.category),
      slug: slug(cleanName),
    });
  }

  return products;
}

async function importData(excelPath: string) {
  console.log('Reading workbook...');
  const products = readWorkbook(excelPath);
  console.log(`Found ${products.length} unique products`);

  const categoryMap = new Map<string, { name: string; slug: string }>();
  for (const p of products) {
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, { name: p.category, slug: p.categorySlug });
    }
  }

  const categories = Array.from(categoryMap.values());
  console.log(`Found ${categories.length} categories`);

  console.log('Inserting categories...');
  const categoryRecords = categories.map((c, i) => ({
    name: c.name,
    slug: c.slug,
    display_order: i,
    status: 'published' as const,
  }));

  for (const cat of categoryRecords) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .single();

    if (existing) {
      console.log(`  Category ${cat.name} already exists, skipping`);
    } else {
      const { error } = await supabase.from('categories').insert(cat);
      if (error) console.error(`  Error inserting ${cat.name}:`, error.message);
      else console.log(`  Inserted category: ${cat.name}`);
    }
  }

  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, slug');

  const categoryBySlug = new Map(categoryData?.map(c => [c.slug, c.id]) || []);

  console.log('Inserting products...');
  let inserted = 0;
  let skipped = 0;

  for (const p of products) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) {
      console.error(`  No category found for ${p.categorySlug}`);
      continue;
    }

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', p.slug)
      .eq('category_id', categoryId)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('products').insert({
      name: p.name,
      slug: p.slug,
      category_id: categoryId,
      status: 'published',
    });

    if (error) {
      console.error(`  Error inserting ${p.name}:`, error.message);
    } else {
      inserted++;
      if (inserted % 50 === 0) console.log(`  Inserted ${inserted} products...`);
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);

  // Catalogue data changed — flag the PDF for regeneration.
  await markPdfOutdated();
}

const excelPath = process.argv[2] || 'PRODUCT LIST (1).xlsx';
importData(excelPath).catch(console.error);