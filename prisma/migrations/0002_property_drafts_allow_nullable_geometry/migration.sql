-- Allow draft property records to be created before map geometry is captured.
ALTER TABLE "Property"
ALTER COLUMN "boundary" DROP NOT NULL,
ALTER COLUMN "centerPoint" DROP NOT NULL;
