import {
  getAdvisoryAnchorFields,
  type AdvisoryAnchorField,
  type AdvisoryTargetType,
} from "@/lib/api";

/**
 * Allowed fields for note anchors and advisory references.
 * Unknown keys are rejected by the backend with 400 ADVISORY_ANCHOR_FIELD_INVALID.
 */
export type AdvisoryFieldDefinition = {
  targetType: AdvisoryTargetType;
  fieldKey: string;
  label: string;
};

export const ADVISORY_FIELD_REGISTRY: AdvisoryFieldDefinition[] = [
  { targetType: "Program", fieldKey: "name", label: "Tên chương trình" },
  { targetType: "Program", fieldKey: "description", label: "Mô tả chương trình" },
  { targetType: "Program", fieldKey: "skillsGained", label: "Kỹ năng đạt được" },
  { targetType: "Program", fieldKey: "level", label: "Cấp độ" },
  { targetType: "Program", fieldKey: "category", label: "Lĩnh vực" },
  { targetType: "Module", fieldKey: "name", label: "Tên học phần" },
  { targetType: "Module", fieldKey: "description", label: "Mô tả học phần" },
  { targetType: "Course", fieldKey: "name", label: "Tên khóa học" },
  { targetType: "Course", fieldKey: "code", label: "Mã khóa học" },
  { targetType: "Course", fieldKey: "description", label: "Mô tả khóa học" },
  { targetType: "Activity", fieldKey: "name", label: "Tên hoạt động" },
  { targetType: "Activity", fieldKey: "durationMinutes", label: "Thời lượng" },
  { targetType: "Assignment", fieldKey: "title", label: "Tiêu đề bài tập" },
  { targetType: "Assignment", fieldKey: "maxPoints", label: "Điểm tối đa" },
  { targetType: "Assignment", fieldKey: "passScore", label: "Điểm đạt" },
  { targetType: "ResearchMilestone", fieldKey: "title", label: "Tiêu đề cột mốc" },
  { targetType: "Material", fieldKey: "title", label: "Tiêu đề tài liệu" },
  { targetType: "RubricCriterion", fieldKey: "title", label: "Tiêu chí rubric" },
  { targetType: "RubricCriterion", fieldKey: "maxScore", label: "Điểm tối đa rubric" },
];

let cachedDynamicRegistry: AdvisoryFieldDefinition[] | null = null;

export async function fetchAdvisoryAnchorFields(): Promise<AdvisoryFieldDefinition[]> {
  if (cachedDynamicRegistry) return cachedDynamicRegistry;
  try {
    const result = await getAdvisoryAnchorFields();
    const items = result?.data ?? [];
    if (items.length > 0) {
      const mapped: AdvisoryFieldDefinition[] = items.map((field: AdvisoryAnchorField) => ({
        targetType: field.targetType,
        fieldKey: field.fieldKey,
        label: field.label || field.fieldKey,
      }));
      cachedDynamicRegistry = mapped;
      return mapped;
    }
  } catch {
    // Keep fallback static registry when offline or before endpoint responds
  }
  return ADVISORY_FIELD_REGISTRY;
}

export function getAdvisoryFieldDefinition(
  targetType: AdvisoryTargetType,
  fieldKey: string,
): AdvisoryFieldDefinition | null {
  const registry = cachedDynamicRegistry ?? ADVISORY_FIELD_REGISTRY;
  return (
    registry.find(
      (field) => field.targetType === targetType && field.fieldKey === fieldKey,
    ) ?? null
  );
}

export function getFieldsForTargetType(
  targetType: AdvisoryTargetType,
): AdvisoryFieldDefinition[] {
  const registry = cachedDynamicRegistry ?? ADVISORY_FIELD_REGISTRY;
  return registry.filter((field) => field.targetType === targetType);
}
