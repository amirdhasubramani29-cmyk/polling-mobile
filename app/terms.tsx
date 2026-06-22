import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/utils/theme";

const Section = ({ title, children, colors }: any) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>{title}</Text>
    <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>{children}</Text>
  </View>
);

export default function TermsScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 28 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>
            Last updated: June 2026 · By using trendingPolls you agree to these terms.
          </Text>
        </View>

        <Section title="1. Acceptance of Terms" colors={colors}>
          By downloading, installing, or using trendingPolls ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
        </Section>

        <Section title="2. Eligibility" colors={colors}>
          You must be at least 13 years old to use trendingPolls. By using the App, you represent and warrant that you meet this age requirement and have the legal capacity to enter into this agreement.
        </Section>

        <Section title="3. Account Responsibility" colors={colors}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information and to keep your account secure.
        </Section>

        <Section title="4. Acceptable Use" colors={colors}>
          You agree not to post polls or content that is illegal, harmful, abusive, defamatory, obscene, or violates the rights of others. You may not use the App to spam, harass, impersonate others, or distribute malware. We reserve the right to remove any content and terminate accounts at our sole discretion.
        </Section>

        <Section title="5. Content Ownership" colors={colors}>
          You retain ownership of the content you create (polls, options, descriptions). By submitting content, you grant trendingPolls a worldwide, royalty-free, non-exclusive licence to display and distribute your content within the App. You are solely responsible for all content you post.
        </Section>

        <Section title="6. Voting & Data Integrity" colors={colors}>
          Each registered user may cast one vote per poll. Attempts to manipulate vote counts through automation, multiple accounts, or other fraudulent means are strictly prohibited and may result in immediate account termination.
        </Section>

        <Section title="7. Disclaimers" colors={colors}>
          trendingPolls is provided "as is" without warranty of any kind. We do not guarantee that the App will be error-free, uninterrupted, or free of viruses. Poll results represent user opinions and do not constitute professional advice of any kind.
        </Section>

        <Section title="8. Limitation of Liability" colors={colors}>
          To the fullest extent permitted by law, trendingPolls and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
        </Section>

        <Section title="9. Modifications" colors={colors}>
          We reserve the right to modify these Terms at any time. We will notify users of material changes. Continued use of the App after such changes constitutes your acceptance of the updated Terms.
        </Section>

        <Section title="10. Contact" colors={colors}>
          For questions regarding these Terms of Service, please contact us via the Feedback page in the app.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}