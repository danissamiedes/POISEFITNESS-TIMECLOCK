"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { uploadLogo, resetLogo, type LogoResult } from "@/app/admin/settings/logo-actions";

const FALLBACK_LOGO = "/brand/poise-logo.svg";

export function LogoUploadForm({ currentLogo }: { currentLogo: string | null }) {
  const router = useRouter();
  const [state, formAction] = useFormState<LogoResult | null, FormData>(uploadLogo, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const shown = preview ?? currentLogo ?? FALLBACK_LOGO;

  useEffect(() => {
    if (state?.ok) {
      setPreview(null);
      formRef.current?.reset();
      router.refresh();
    }
  }, [state?.ok, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function doReset() {
    setResetMsg(null);
    startReset(async () => {
      const res = await resetLogo();
      setResetMsg(res.ok ? "Reverted to the default logo." : res.error ?? "Failed");
      if (res.ok) {
        setPreview(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-700">Logo / branding</h2>
      <p className="mt-1 text-xs text-gray-500">
        Upload your studio logo. It appears on the sign-in screen and in the app
        header. PNG, JPG, WEBP, GIF, or SVG, up to 2 MB. A square image works best.
      </p>

      <div className="mt-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown}
          alt="Current logo"
          className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
        />
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={onPick}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-poise-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-poise-accentHover"
          />
          <div className="flex items-center gap-3">
            <SaveButton />
            <button
              type="button"
              onClick={doReset}
              disabled={resetting}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Reset to default
            </button>
          </div>
        </form>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Logo updated.
        </p>
      )}
      {resetMsg && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {resetMsg}
        </p>
      )}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-poise-accent px-4 py-2 text-sm font-semibold text-white hover:bg-poise-accentHover disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload logo"}
    </button>
  );
}
