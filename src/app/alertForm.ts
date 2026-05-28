import type { NewAlertRuleInput } from "../domain/types";

export interface AlertFormState {
  name: string;
  category: string;
  thresholdType: string;
  thresholdValue: string;
  channel: string;
  destination: string;
  active: boolean;
}

export const DEFAULT_ALERT_FORM: AlertFormState = {
  name: "",
  category: "disaster",
  thresholdType: "severity",
  thresholdValue: "high",
  channel: "email",
  destination: "",
  active: true
};

export function toAlertRuleRequest(form: AlertFormState): NewAlertRuleInput {
  return {
    name: form.name.trim(),
    category: form.category as NewAlertRuleInput["category"],
    thresholdType: form.thresholdType as NewAlertRuleInput["thresholdType"],
    thresholdValue: form.thresholdValue.trim(),
    channel: form.channel as NewAlertRuleInput["channel"],
    destination: form.destination.trim(),
    active: form.active
  };
}
