-- Fix depth and path errors for 5 categories
-- Sunucu children: depth 2 → 4 (parent Sunucu has depth=3)
-- İş İstasyonları children: depth 2 → 3 (parent İş İstasyonları has depth=2)

-- Rack Tipi Sunucular: depth=2 → 4, path fix
UPDATE categories
SET
  depth = 4,
  path  = (SELECT path FROM categories WHERE id = (SELECT parent_id FROM categories WHERE name = 'Rack Tipi Sunucular'))
          || '/' ||
          (SELECT slug FROM categories WHERE name = 'Rack Tipi Sunucular')
WHERE name = 'Rack Tipi Sunucular';

-- Tower Tipi Sunucular: depth=2 → 4, path fix
UPDATE categories
SET
  depth = 4,
  path  = (SELECT path FROM categories WHERE id = (SELECT parent_id FROM categories WHERE name = 'Tower Tipi Sunucular'))
          || '/' ||
          (SELECT slug FROM categories WHERE name = 'Tower Tipi Sunucular')
WHERE name = 'Tower Tipi Sunucular';

-- Sunucu Aksesuarları (child of Sunucu): depth=2 → 4, path fix
UPDATE categories
SET
  depth = 4,
  path  = (SELECT path FROM categories WHERE id = (SELECT parent_id FROM categories WHERE name = 'Sunucu Aksesuarları'))
          || '/' ||
          (SELECT slug FROM categories WHERE name = 'Sunucu Aksesuarları')
WHERE name = 'Sunucu Aksesuarları';

-- Masaüstü İş İstasyonları: depth=2 → 3, path fix
UPDATE categories
SET
  depth = 3,
  path  = (SELECT path FROM categories WHERE id = (SELECT parent_id FROM categories WHERE name = 'Masaüstü İş İstasyonları'))
          || '/' ||
          (SELECT slug FROM categories WHERE name = 'Masaüstü İş İstasyonları')
WHERE name = 'Masaüstü İş İstasyonları';

-- Mobil İş İstasyonları: depth=2 → 3, path fix
UPDATE categories
SET
  depth = 3,
  path  = (SELECT path FROM categories WHERE id = (SELECT parent_id FROM categories WHERE name = 'Mobil İş İstasyonları'))
          || '/' ||
          (SELECT slug FROM categories WHERE name = 'Mobil İş İstasyonları')
WHERE name = 'Mobil İş İstasyonları';
