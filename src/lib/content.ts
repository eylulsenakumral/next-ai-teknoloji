import { cache } from "react"
import { prisma } from "./db"

export const getSolutions = cache(async (category?: "MAIN" | "ANALYTICS") => {
  return prisma.solution.findMany({
    where: { isActive: true, deletedAt: null, ...(category ? { category } : {}) },
    orderBy: { sortOrder: "asc" },
  })
})

export const getSectors = cache(async () => {
  return prisma.sector.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
})

export const getReferenceProjects = cache(async () => {
  return prisma.referenceProject.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
})

export const getFaqs = cache(async (group?: string) => {
  return prisma.faq.findMany({
    where: { isActive: true, deletedAt: null, ...(group ? { group } : {}) },
    orderBy: { sortOrder: "asc" },
  })
})

export const getTestimonials = cache(async () => {
  return prisma.testimonial.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
})

export const getMilestones = cache(async () => {
  return prisma.milestone.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
})

export const getBlogPosts = cache(async (limit?: number) => {
  return prisma.blogPost.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  })
})