import { yearEnum, studyEnum } from "@/lib/db/schema";
import { z } from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(2, "Navnet ditt må være minst 2 tegn.")
    .max(255, "Navnet ditt kan ikke være lengre enn 255 tegn."),
  email: z
    .string()
    .min(1, "E-post er påkrevd.")
    .email("Må være en gyldig e-postadresse."),
  yearOfStudy: z.enum(yearEnum.enumValues, {
    errorMap: () => ({
      message: "Du må velge et gyldig årstrinn.",
    }),
  }),
  fieldOfStudy: z.enum(studyEnum.enumValues, {
    errorMap: () => ({
      message: "Du må velge en gyldig studieretning.",
    }),
  }),
  reason: z
    .string()
    .min(10, "Søknaden din må innholde minst 10 tegn")
    .max(1000, "Søknaden din kan ikke være lengre enn 1000 tegn."),
});
