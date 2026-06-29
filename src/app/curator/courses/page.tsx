import { createClient } from "@/lib/supabase/server";
import CourseForm from "@/components/curator/course-form";
import DeleteCourseButton from "@/components/curator/delete-course-button";

export const dynamic = "force-dynamic";

export default async function CuratorCoursesPage() {
  const supabase = await createClient();
  const [{ data: resources }, { data: skills }] = await Promise.all([
    supabase.from("skill_resources").select("*, skills(name)").order("created_at", { ascending: false }),
    supabase.from("skills").select("*").order("name"),
  ]);

  return (
    <div>
      <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Add a course / resource</h2>
      <CourseForm skills={skills ?? []} />

      <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold text-ink">All courses</h2>
      <div className="space-y-2">
        {(resources ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5">
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{r.title}</p>
              <p className="text-[11px] text-ink/45">
                {(r.skills as unknown as { name: string })?.name} · {r.level} {r.curator_verified ? "· Verified" : ""}
              </p>
            </div>
            <DeleteCourseButton id={r.id} />
          </div>
        ))}
        {(resources ?? []).length === 0 && <p className="text-[13px] text-ink/50">No courses yet.</p>}
      </div>
    </div>
  );
}
