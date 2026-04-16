import { CalendarDays, PencilLine } from "lucide-react"
import { toDisplayDate } from "./profile-utils"
import type { ProfileFormState, ProfileRecord } from "./profile-types"

type ProfileAccountSectionProps = {
  profile: ProfileRecord | null
  userEmail: string
  initials: string
  profileForm: ProfileFormState
  isEditingProfile: boolean
  isSavingProfile: boolean
  profileError: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onFieldChange: <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => void
}

export function ProfileAccountSection({
  profile,
  userEmail,
  initials,
  profileForm,
  isEditingProfile,
  isSavingProfile,
  profileError,
  onStartEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
}: ProfileAccountSectionProps) {
  const selectedGender = (isEditingProfile ? profileForm.gender : profile?.gender || "").toLowerCase()

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <h2 className="font-serif text-2xl text-neutral-900">Personal Information</h2>
        {!isEditingProfile ? (
          <button
            onClick={onStartEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-black hover:text-black"
          >
            <PencilLine className="h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-60"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-black hover:text-black"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full border border-neutral-200 bg-white text-2xl font-semibold text-neutral-700">
          {initials}
          <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600">
            <PencilLine className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-neutral-800">First Name</span>
          <input
            readOnly={!isEditingProfile}
            value={profileForm.firstName}
            onChange={(event) => onFieldChange("firstName", event.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-neutral-700 ${
              isEditingProfile ? "border-neutral-300 bg-white" : "border-neutral-200 bg-neutral-50"
            }`}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-neutral-800">Last Name</span>
          <input
            readOnly={!isEditingProfile}
            value={profileForm.lastName}
            onChange={(event) => onFieldChange("lastName", event.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-neutral-700 ${
              isEditingProfile ? "border-neutral-300 bg-white" : "border-neutral-200 bg-neutral-50"
            }`}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-neutral-800">Date Of Birth</span>
          <div className="relative">
            <input
              type={isEditingProfile ? "date" : "text"}
              readOnly={!isEditingProfile}
              value={isEditingProfile ? profileForm.dateOfBirth : toDisplayDate(profile?.date_of_birth) || "--/--/----"}
              onChange={(event) => onFieldChange("dateOfBirth", event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 pr-11 text-neutral-700 ${
                isEditingProfile ? "border-neutral-300 bg-white" : "border-neutral-200 bg-neutral-50"
              }`}
            />
            <CalendarDays className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </div>
        </label>

        <div className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-neutral-800">Gender</span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => isEditingProfile && onFieldChange("gender", "male")}
              className="flex items-center gap-2 text-sm text-neutral-700"
            >
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  selectedGender === "male" ? "border-black" : "border-neutral-300"
                }`}
              />
              Male
            </button>
            <button
              type="button"
              onClick={() => isEditingProfile && onFieldChange("gender", "female")}
              className="flex items-center gap-2 text-sm text-neutral-700"
            >
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  selectedGender === "female" ? "border-black" : "border-neutral-300"
                }`}
              />
              Female
            </button>
            <button
              type="button"
              onClick={() => isEditingProfile && onFieldChange("gender", "other")}
              className="flex items-center gap-2 text-sm text-neutral-700"
            >
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  selectedGender === "other" ? "border-black" : "border-neutral-300"
                }`}
              />
              Other
            </button>
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-neutral-800">Phone Number</span>
          <div className={`flex overflow-hidden rounded-xl border ${isEditingProfile ? "border-neutral-300" : "border-neutral-200 bg-neutral-50"}`}>
            <span className="inline-flex items-center border-r border-neutral-200 px-3 text-sm text-neutral-600">+971</span>
            <input
              readOnly={!isEditingProfile}
              value={profileForm.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              className="w-full bg-transparent px-3 py-3 text-neutral-700"
            />
          </div>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-neutral-800">Email</span>
          <input
            readOnly
            value={userEmail}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700"
          />
          <p className="text-xs text-neutral-500">Email is authenticated via your login provider and cannot be changed here.</p>
        </label>

        {profileError && <p className="text-sm text-red-600">{profileError}</p>}
      </div>
    </section>
  )
}
