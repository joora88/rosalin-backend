-- CreateEnum
CREATE TYPE "FocusType" AS ENUM ('actor', 'object', 'locative', 'beneficiary');

-- CreateEnum
CREATE TYPE "Aspect" AS ENUM ('infinitive', 'completed', 'incomplete', 'contemplated');

-- CreateTable
CREATE TABLE "verbs" (
    "id" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verb_focus_types" (
    "id" TEXT NOT NULL,
    "verbId" TEXT NOT NULL,
    "type" "FocusType" NOT NULL,
    "affix" TEXT NOT NULL,

    CONSTRAINT "verb_focus_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verb_forms" (
    "id" TEXT NOT NULL,
    "focusTypeId" TEXT NOT NULL,
    "aspect" "Aspect" NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "verb_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verb_examples" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "tagalog" TEXT NOT NULL,
    "english" TEXT NOT NULL,

    CONSTRAINT "verb_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verb_focus_types_verbId_type_key" ON "verb_focus_types"("verbId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "verb_forms_focusTypeId_aspect_key" ON "verb_forms"("focusTypeId", "aspect");

-- AddForeignKey
ALTER TABLE "verb_focus_types" ADD CONSTRAINT "verb_focus_types_verbId_fkey" FOREIGN KEY ("verbId") REFERENCES "verbs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verb_forms" ADD CONSTRAINT "verb_forms_focusTypeId_fkey" FOREIGN KEY ("focusTypeId") REFERENCES "verb_focus_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verb_examples" ADD CONSTRAINT "verb_examples_formId_fkey" FOREIGN KEY ("formId") REFERENCES "verb_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
