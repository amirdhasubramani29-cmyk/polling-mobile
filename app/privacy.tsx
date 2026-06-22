import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/utils/theme";

const Section = ({ title, children, colors }: any) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>{title}</Text>
    <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>{children}</Text>
  </View>
);

export default function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 28 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>
            Last updated: June 2026 · Effective immediately for all users of trendingPolls.
          </Text>
        </View>

        <Section title="1. Information We Collect" colors={colors}>
          We collect information you provide when creating an account (name, email address, password), as well as activity data such as polls you create or vote on. We also collect non-personal technical data including device type, OS version, and anonymised usage statistics to improve the app.
        </Section>

        <Section title="2. How We Use Your Information" colors={colors}>
          Your information is used to operate and improve trendingPolls — to authenticate your account, display your polls, send email notifications (such as OTP codes), and provide customer support. We do not sell your personal data to third parties.
        </Section>

        <Section title="3. Data Storage & Security" colors={colors}>
          Your data is stored on secure servers. Passwords are hashed using industry-standard algorithms and are never stored in plain text. We use TLS/HTTPS for all data in transit. While we take every reasonable precaution, no system is 100% secure.
        </Section>

        <Section title="4. Cookies & Local Storage" colors={colors}>
          The app stores an authentication token securely on your device using encrypted storage (expo-secure-store). This token is used to keep you logged in. No advertising cookies or third-party trackers are used.
        </Section>

        <Section title="5. Sharing of Information" colors={colors}>
          We do not share, sell, rent, or trade your personal information with third parties for their commercial purposes. We may share aggregated, anonymised data (e.g. total vote counts) publicly.
        </Section>

        <Section title="6. Your Rights" colors={colors}>
          You have the right to access, correct, or delete your personal data at any time. You can delete your account from the Profile screen or by contacting us via the Feedback page. Upon deletion, all personally identifiable data is permanently removed within 30 days.
        </Section>

        <Section title="7. Children's Privacy" colors={colors}>
          trendingPolls is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
        </Section>

        <Section title="8. Changes to This Policy" colors={colors}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by email. Continued use of trendingPolls after changes constitutes acceptance of the revised policy.
        </Section>

        <Section title="9. Contact Us" colors={colors}>
          If you have any questions about this Privacy Policy or how your data is handled, please reach out through the Feedback page in the app.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}