import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { PublicLanguageSelect } from "@/components/public-language-select";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function getAboutHeaderCopy() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", data.user.id)
        .maybeSingle()
    : { data: null };
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get("creative_companion_language")?.value;
  const t = getDictionary(
    normalizeLanguage(profile?.preferred_language ?? cookieLanguage),
  );

  return {
    copy: t.publicPages,
    currentLanguage: profile?.preferred_language ?? cookieLanguage,
  };
}

function AboutParagraph({
  children,
  indent = false,
}: {
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <p className={indent ? "indent-10" : undefined}>
      {children}
    </p>
  );
}

async function AboutContent() {
  const { copy, currentLanguage } = await getAboutHeaderCopy();

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-5xl flex-1 p-5">
        <nav className="flex flex-col gap-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-semibold tracking-wide">
            {copy.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <PublicLanguageSelect currentLanguage={currentLanguage} />
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              {copy.backHome}
            </Link>
            <Link
              href="/crisis"
              className="text-muted-foreground hover:text-foreground"
            >
              {copy.crisisResources}
            </Link>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <article className="paper-surface my-8 rounded-3xl border border-border/70 px-6 py-8 shadow-sm md:px-12 md:py-10">
          <div className="mx-auto max-w-3xl font-sans text-base leading-8 text-foreground md:text-lg">
            <h1 className="mb-8 text-center font-sans text-3xl font-semibold leading-tight md:text-4xl">
              The Stories Behind Creative Companion
            </h1>

            <AboutParagraph>
              Hi there! I&apos;m Yike, the developer of Creative Companion.
              I&apos;m a high school student, an art lover, and a childhood
              cancer survivor.
            </AboutParagraph>

            <section className="mt-8">
              <h2 className="font-sans text-xl font-semibold">
                (1) Why create Creative Companion?
              </h2>
              <AboutParagraph indent>
                During treatments, being an art-love since a very young age, I
                naturally turned to art when tough moments approached. I
                doddled mindlessly for distractions; I painted my frustration
                after chemotherapy bombarded by vomiting; I even drew out the
                snacks that I longed for during transplant (as I am a huge
                foodie &gt;_&lt;). The restorative power of art-making went
                beyond my expectations. Through art, I was able to express the
                feelings that are too personal to be understood by anyone other
                than myself going through treatments; I was able to process my
                feelings without being overwhelmed by them.
              </AboutParagraph>
              <AboutParagraph indent>
                Aligning with my experiences, studies have found art-based
                intervention, including both art therapy and creative arts
                without clinical interpretation, to be a beneficial
                complementary intervention for cancer patients&apos; mental
                wellbeing and quality of life (Kaimal et al., 2020; Rivest et
                al., 2025). However, art therapy may not be readily accessible
                due to various reasons, such as limited art therapists in the
                region or insurance coverage.{" "}
                <strong>
                  My original purpose of creating this website is, therefore,
                  to make the art-making process more accessible for cancer
                  patients and survivors.
                </strong>
              </AboutParagraph>
              <AboutParagraph indent>
                Nevertheless, it is important to emphasize that Creative
                Companion is <strong>NOT</strong> a therapy website and does{" "}
                <strong>NOT</strong> possess the credentials for art therapy.
                Instead, it is a safe space for emotion processing through the
                users&apos; personal, creative processes.
              </AboutParagraph>
            </section>

            <section className="mt-8">
              <h2 className="font-sans text-xl font-semibold">
                (2) Why incorporate AI in Creative Companion?
              </h2>
              <AboutParagraph indent>
                To answer this question, I would like to first explain the role
                of AI in Creative Companion. Here, the AI{" "}
                <strong>ASSIST</strong> in helping users reflect on their
                emotions and <strong>recommends</strong> personalized art-based
                coping activities. As studies highlight the risk of
                over-reliance on AI tools in art-based interventions and the
                possibilities of increasing sense of agency via those
                interventions, Creative Companion is aware of the risks of AI
                and strives to protect users&apos; autonomy (Zubala et al.,
                2025; Kaimal et al., 2020).
              </AboutParagraph>
              <AboutParagraph indent>
                Thus, the AI&apos;s role here is, and will always be an
                assistance. Users, having full choices of consent settings,
                emotion diary entries, and the final process of art creating,
                are the absolute protagonists of their emotional journey and
                creative processes. AI does not produce art in this process.
              </AboutParagraph>
              <AboutParagraph indent>
                That being said, Creative Companion is <strong>AGAINST</strong>{" "}
                the idea that AI could replace humans&apos; role in emotional
                support and creative activities. Instead, Creative Companion
                aims to promote growth of emotional agency and every
                user&apos;s unique creativity.
              </AboutParagraph>
              <AboutParagraph indent>
                &quot;Then why still use AI?&quot; One may ask. Emotional needs
                vary between people, especially when factors such as age, cancer
                type, or treatment phases add nuances to one&apos;s needs.
                Therefore, AI is incorporated to achieve the goal of delivering
                personalized service.
              </AboutParagraph>
              <AboutParagraph indent>
                At Creative Companion, with consents, the art-inspired coping
                recommendations delivered by AI are based on analysis of
                users&apos; basic profile information, emotional diary entries,
                and curated reliable mental health information sources.
              </AboutParagraph>
              <AboutParagraph indent>
                In addition, individuals&apos; feelings and understandings
                about art-making differ. For example, one may prefer drawing
                with their own ideas and inspirations; some may find
                step-by-step guidance making the creative process less
                intimidating. Recognizing those preference differences, I
                incorporated AI to provide step-by-step guides for art-based
                coping activities, along with a drawing space without AI
                recommendations if preferred, hoping to make creating art
                possible and relaxing for <strong>everyone.</strong>
              </AboutParagraph>
            </section>

            <section className="mt-8">
              <h2 className="font-sans text-xl font-semibold">
                (3) Is using Creative Companion safe?
              </h2>
              <AboutParagraph indent>
                As someone who had been through mental health struggles during
                cancer treatments, I am aware of the safety risks and ethical
                concerns of Creative Companion, especially after incorporating
                AI.
              </AboutParagraph>
              <AboutParagraph indent>
                First and foremost, it is again important to note that Creative
                Companion is <strong>not</strong> a clinical support tool and
                can <strong>never</strong> replace licensed mental health
                professionals. The mental risk of an emotional support platform
                is worth addressing (Blease et al., 2020; Ohu et al., 2025).
                Currently, the website features crisis resources and high-risk
                emotion detection, through which reminder messages regarding
                the need of professional support would appear. Creative
                Companion&apos;s responses to acute clinical symptoms such as
                suicidal intention is still in its preliminary stage and would
                require ongoing development.
              </AboutParagraph>
              <AboutParagraph indent>
                A safe and ethical use of AI is also one of the top priorities.
                Recognizing the potential harm of AI{" "}
                <strong>hallucination</strong>, especially under the context of
                emotional support for cancer populations, I used the
                Retrieval-Augmented Generation framework so that the
                recommendations given by AI are based on{" "}
                <strong>curated, reliable</strong> mental health sources.
                Creative Companion also values the <strong>privacy</strong> of
                every user. Therefore, the website only collects minimal
                identifiable information for user profiles. All information
                disclosures are transparent and could be managed by consent
                settings. The user data is securely stored in an online
                database.
              </AboutParagraph>
              <AboutParagraph indent>
                I acknowledge the <strong>limitations</strong> of current
                safety precautions. Currently, Creative Companion has not found
                an optimal way to address dangerous users&apos; reliance, the
                lack of real-time feedback for urgent emotional needs,
                additional stress that inaccurate AI-recommendations may cause,
                potential biases in the AI model for recommendations, and the
                risks of cyber attack to the user database.
              </AboutParagraph>
              <AboutParagraph indent>
                I will continue learning and developing, hoping to make the
                experience at Creative Companion safer and more helpful for
                every user. In the meantime, I would really appreciate any
                feedback or suggestions on any facets of Creative Companion.
              </AboutParagraph>
            </section>

            <section className="mt-10 border-t border-border/70 pt-8 text-sm leading-7 md:text-base">
              <h2 className="mb-4 font-sans text-lg font-semibold">
                References:
              </h2>
              <div className="grid gap-6">
                <p>
                  Blease, C., & Torous, J. (2023). ChatGPT and mental
                  healthcare: balancing benefits with risks of harms.{" "}
                  <em>BMJ Ment Health, 26</em>(1).{" "}
                  <a
                    href="https://doi.org/10.1136/bmjment-2023-300884"
                    className="underline underline-offset-4"
                  >
                    https://doi.org/10.1136/bmjment-2023-300884
                  </a>
                </p>
                <p>
                  Kaimal, G., Carroll-Haskins, K., Mensinger, J. L.,
                  Dieterich-Hartwell, R., Biondo, J., & Levin, W. P. (2020).
                  Outcomes of Therapeutic Artmaking in Patients Undergoing
                  Radiation Oncology Treatment: A Mixed-Methods Pilot Study.{" "}
                  <em>Integrative Cancer Therapies, 19</em>,
                  153473542091283.{" "}
                  <a
                    href="https://doi.org/10.1177/1534735420912835"
                    className="underline underline-offset-4"
                  >
                    https://doi.org/10.1177/1534735420912835
                  </a>
                </p>
                <p>
                  Ohu, F. C., Burrell, D. N., & Jones, L. A. (2025). Public
                  Health Risk Management, Policy, and Ethical Imperatives in
                  the Use of AI Tools for Mental Health Therapy.{" "}
                  <em>Healthcare, 13</em>(21), 2721-2721.{" "}
                  <a
                    href="https://doi.org/10.3390/healthcare13212721"
                    className="underline underline-offset-4"
                  >
                    https://doi.org/10.3390/healthcare13212721
                  </a>
                </p>
                <p>
                  Rivest, J., Pellerin, A., Desbeaumes Jodoin, V., Haslam, J.,
                  Martineau, J. T., Caron, D., & Chammas, M. (2025).
                  Integrating Art-Based Approaches in Psycho-Oncology Practice:
                  Insights From a Pilot Creative Arts Workshop Designed for
                  Cancer Patients Receiving Psychiatric Care.{" "}
                  <em>Journal of Patient Experience, 12</em>.{" "}
                  <a
                    href="https://doi.org/10.1177/23743735251380955"
                    className="underline underline-offset-4"
                  >
                    https://doi.org/10.1177/23743735251380955
                  </a>
                </p>
                <p>
                  Zubala, A., Pease, A., Łyszkiewicz, K., & Hackett, S. (2025).
                  Art psychotherapy meets creative AI: an integrative review
                  positioning the role of creative AI in art therapy process.{" "}
                  <em>Frontiers in Psychology, 16</em>.{" "}
                  <a
                    href="https://doi.org/10.3389/fpsyg.2025.1548396"
                    className="underline underline-offset-4"
                  >
                    https://doi.org/10.3389/fpsyg.2025.1548396
                  </a>
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

export default function AboutPage() {
  return (
    <Suspense>
      <AboutContent />
    </Suspense>
  );
}
