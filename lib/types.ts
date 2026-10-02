export type LessonStatus = "planned" | "done" | "cancelled";

export interface Student {
  id: string;
  name: string;
  parentName?: string;
  phone?: string; // 05xx xxx xx xx
  fee?: number; // varsayılan ders ücreti
  note?: string;
  active: boolean;
  createdAt: number;
}

export interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  phone?: string;
  date: number; // timestamp ms
  durationMin: number;
  fee: number;
  status: LessonStatus;
  paid: boolean;
  groupId?: string;
  note?: string;
  createdAt: number;
}
