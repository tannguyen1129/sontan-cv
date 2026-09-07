"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, Award, BrainCircuit, BriefcaseBusiness, Check, Code2, ExternalLink, Github, GraduationCap, Linkedin, Mail, MapPin, Menu, MessageSquareText, Moon, Send, Sparkles, Sun, Terminal, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoData } from "@/lib/data";
import { PortfolioData } from "@/lib/types";
import { cn } from "@/lib/utils";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github,
  linkedin: Linkedin,
  brain: BrainCircuit,
  message: MessageSquareText,
  sparkles: Sparkles,
};
const formatDate = (value: string | null, current = false, lang: "vi" | "en" = "vi") => {
  if (current) return lang === "vi" ? "Hiện tại" : "Present";
  if (!value) return "";
  const parsed = new Date(value);
  return lang === "vi"
    ? `${String(parsed.getUTCMonth() + 1).padStart(2, "0")}/${parsed.getUTCFullYear()}`
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed);
};
const formatMonthYear = (month: number, year: number, lang: "vi" | "en") =>
  lang === "vi"
    ? `${String(month).padStart(2, "0")}/${year}`
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(year, month - 1, 1));
const formatDateRange = (start: string, end: string | null, current: boolean, lang: "vi" | "en") => {
  const first = formatDate(start, false, lang);
  if (current) return `${first} — ${formatDate(null, true, lang)}`;
  if (!end) return first;
  const last = formatDate(end, false, lang);
  return start.slice(0, 7) === end.slice(0, 7) ? first : `${first} — ${last}`;
};
const formatEducationRange = (startMonth: number, startYear: number, endMonth: number, endYear: number | null, lang: "vi" | "en") => {
  const first = formatMonthYear(startMonth, startYear, lang);
  if (!endYear) return `${first} — ${lang === "vi" ? "Hiện tại" : "Present"}`;
  const last = formatMonthYear(endMonth, endYear, lang);
  return startMonth === endMonth && startYear === endYear ? first : `${first} — ${last}`;
};

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="section-heading">
      <p>
        <span>~/</span>
        {eyebrow}
      </p>
      <h2>{title}</h2>
      {copy && <div>{copy}</div>}
    </div>
  );
}

export function Portfolio() {
  const [data, setData] = useState<PortfolioData>(demoData);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState<"vi" | "en">("en");
  const [journeyTab, setJourneyTab] = useState<"experience" | "education">("experience");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    fetch(`${API}/`)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => setData({ ...demoData, ...d, profile: d.profile || demoData.profile }))
      .catch(() => {});
  }, []);
  const p = data.profile!;
  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const local = (item: Record<string, any>, field: string) => (lang === "en" && item[`${field}_en`] ? String(item[`${field}_en`]) : String(item[field] || ""));
  const localList = (item: Record<string, any>, field: string) => (lang === "en" && Array.isArray(item[`${field}_en`]) ? (item[`${field}_en`] as string[]) : (item[field] as string[]) || []);
  const categoryLabel = (value: string) =>
    ({
      frontend: t("Giao diện", "Frontend"),
      backend: t("Máy chủ", "Backend"),
      database: t("Cơ sở dữ liệu", "Database"),
      devops: t("DevOps & Công cụ", "DevOps & Tools"),
      other: t("Khác", "Other"),
    })[value] || value;
  const categories = useMemo(() => ["all", ...Array.from(new Set(data.skills.map((s) => s.category)))], [data.skills]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch(`${API}/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw Error();
      setSent(true);
      form.reset();
    } catch {
      alert(t("Chưa thể gửi tin nhắn. Bạn có thể liên hệ trực tiếp qua email.", "Unable to send your message. Please contact me directly by email."));
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="site-shell">
      <div className="grid-bg" />
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <header className="nav-wrap">
        <nav className="nav container">
          <a href="#home" className="brand">
            <span>&lt;ST /&gt;</span>
            <i>portfolio.sys</i>
          </a>
          <div className={cn("nav-links", menu && "open")}>
            {[
              ["experience", t("Kinh nghiệm", "Experience")],
              ["projects", t("Dự án", "Projects")],
              ["skills", t("Kỹ năng", "Skills")],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
            <a href="#contact" onClick={() => setMenu(false)}>
              {t("Liên hệ", "Contact")} <ArrowUpRight />
            </a>
          </div>
          <div className="nav-actions">
            <button className="lang-switch" aria-label={t("Chuyển sang tiếng Anh", "Switch to Vietnamese")} onClick={() => setLang(lang === "vi" ? "en" : "vi")}>
              {lang === "vi" ? "EN" : "VI"}
            </button>
            <button aria-label={t("Đổi giao diện", "Toggle theme")} onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <button className="mobile-menu" aria-label={t("Mở menu", "Open menu")} onClick={() => setMenu(!menu)}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section id="home" className="hero container">
          <div className="hero-copy">
            <div className="status-pill">
              <i /> {local(p, "availability")}
            </div>
            <p className="hello">{t("Xin chào, mình là", "Hello, I am")}</p>
            <h1>
              {p.full_name}
              <span>.</span>
            </h1>
            <div className="type-line">
              <span>&gt;</span> {local(p, "headline")}
              <i>_</i>
            </div>
            <p className="hero-intro">{local(p, "short_bio")}</p>
            <div className="hero-actions">
              <Button size="lg" asChild>
                <a href="#projects">
                  {t("Xem dự án", "View projects")} <ArrowDown />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={p.resume_url || "#contact"} target={p.resume_url ? "_blank" : undefined}>
                  {t("Tải CV", "Download CV")} <ArrowUpRight />
                </a>
              </Button>
            </div>
            <div className="social-row">
              {data.socials.map((s) => {
                const Icon = iconMap[s.icon] || ExternalLink;
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer" aria-label={local(s, "label")}>
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="hero-visual">
            <div className="code-card">
              <div className="code-top">
                <span />
                <span />
                <span />
                <p>engineer.ts</p>
              </div>
              <pre>
                <code>
                  <em>const</em> engineer = {"{"}
                  {`\n`} name: <b>&quot;{p.full_name}&quot;</b>,{`\n`} role: <b>&quot;{local(p, "headline")}&quot;</b>,{`\n`} location: <b>&quot;{local(p, "location")}&quot;</b>,{`\n`} mindset: [<b>&quot;operate&quot;</b>, <b>&quot;automate&quot;</b>, <b>&quot;improve&quot;</b>],{`\n`} available: <u>true</u>
                  {`\n`}
                  {"}"};
                </code>
              </pre>
              <div className="terminal-line">
                <span>➜</span> {t("đang vận hành những hệ thống đáng tin cậy...", "operating reliable systems...")}
              </div>
            </div>
            <div className="orbit">
              <Code2 />
              <span />
              <span />
            </div>
          </div>
          <div className="metrics">
            {[
              [`${p.years_experience}+`, t("Năm kinh nghiệm", "Years experience")],
              [`${p.projects_count}+`, t("Dự án hoàn thành", "Projects delivered")],
              [`${p.coffee_count}+`, t("Cốc cà phê", "Cups of coffee")],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="experience" className="section section-tint journey-section">
          <div className="container">
            <div className="journey-head">
              <SectionTitle eyebrow="journey.log" title={t("Hành trình phát triển", "Professional journey")} copy={t("Từng cột mốc, một lớp kinh nghiệm trong cách tôi xây dựng và vận hành hệ thống.", "Every milestone adds a layer to how I build and operate reliable systems.")} />
              <div className="journey-tabs" role="tablist" aria-label={t("Chọn loại hành trình", "Choose journey type")}>
                <button role="tab" aria-selected={journeyTab === "experience"} className={journeyTab === "experience" ? "active" : ""} onClick={() => setJourneyTab("experience")}>
                  <BriefcaseBusiness />
                  <span>{t("Kinh nghiệm", "Experience")}</span>
                  <b>{String(data.experiences.length).padStart(2, "0")}</b>
                </button>
                <button role="tab" aria-selected={journeyTab === "education"} className={journeyTab === "education" ? "active" : ""} onClick={() => setJourneyTab("education")}>
                  <GraduationCap />
                  <span>{t("Học vấn", "Education")}</span>
                  <b>{String(data.education.length).padStart(2, "0")}</b>
                </button>
              </div>
            </div>
            <div className="journey-panel" role="tabpanel">
              {journeyTab === "experience" ? (
                data.experiences.length ? (
                  <div className="journey-list">
                    {data.experiences.map((x, i) => (
                      <article className="journey-card" key={x.id}>
                        <div className="journey-date">
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          <strong>{formatDateRange(x.start_date, x.end_date, x.is_current, lang)}</strong>
                        </div>
                        <div className="journey-content">
                          <div className="journey-company">
                            {x.company_logo ? (
                              <img src={x.company_logo} alt={`Logo ${local(x, "company")}`} />
                            ) : (
                              <div className="journey-logo">
                                <BriefcaseBusiness />
                              </div>
                            )}
                            <div>
                              <h3>{local(x, "company")}</h3>
                              <a href={x.company_url || undefined}>{x.company_url ? t("Website công ty", "Company website") : ""}</a>
                              {local(x, "location") && (
                                <span className="company-location">
                                  <MapPin />
                                  {local(x, "location")}
                                </span>
                              )}
                            </div>
                          </div>
                          {x.positions?.length ? (
                            <div className="position-list">
                              {x.positions.map((position) => (
                                <section className="position-item" key={position.id}>
                                  <div className="position-heading">
                                    <div>
                                      <h4>{local(position, "role")}</h4>
                                      {local(position, "employment_type") && <span>{local(position, "employment_type")}</span>}
                                    </div>
                                    <time>{formatDateRange(position.start_date, position.end_date, position.is_current, lang)}</time>
                                  </div>
                                  {local(position, "description") && <p className="journey-description">{local(position, "description")}</p>}
                                </section>
                              ))}
                            </div>
                          ) : (
                            <>
                              <h4 className="legacy-role">{local(x, "role")}</h4>
                              {local(x, "employment_type") && (
                                <div className="journey-meta">
                                  <span>{local(x, "employment_type")}</span>
                                </div>
                              )}
                              <p className="journey-description">{local(x, "description")}</p>
                            </>
                          )}
                          {localList(x, "highlights").length > 0 && (
                            <ul className="journey-highlights">
                              {localList(x, "highlights").map((v) => (
                                <li key={v}>
                                  <Check />
                                  {v}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="tag-row">
                            {x.technologies.map((v) => (
                              <Badge key={v}>{v}</Badge>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="cms-empty standalone">{t("Kinh nghiệm sẽ được cập nhật từ CMS.", "Experience will be added through the CMS.")}</p>
                )
              ) : data.education.length ? (
                <div className="journey-list">
                  {data.education.map((x, i) => (
                    <article className="journey-card education-card" key={x.id}>
                      <div className="journey-date">
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <strong>{formatEducationRange(x.start_month, x.start_year, x.end_month, x.end_year, lang)}</strong>
                      </div>
                      <div className="journey-content">
                        <div className="journey-company">
                          {x.school_logo ? (
                            <img src={x.school_logo} alt={`Logo ${local(x, "school")}`} />
                          ) : (
                            <div className="journey-logo">
                              <GraduationCap />
                            </div>
                          )}
                          <div>
                            <h3>{local(x, "degree")}</h3>
                            <a href={x.school_url || undefined}>{local(x, "school")}</a>
                          </div>
                        </div>
                        {x.program_type === "degree" && (local(x, "field_of_study") || x.grade) && (
                          <div className="journey-meta">
                            {local(x, "field_of_study") && <span>{local(x, "field_of_study")}</span>}
                            {x.grade && <span>GPA {x.grade}</span>}
                          </div>
                        )}
                        <p className="journey-description">{local(x, "description")}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="cms-empty standalone">{t("Học vấn sẽ được cập nhật từ CMS.", "Education will be added through the CMS.")}</p>
              )}
            </div>
          </div>
        </section>

        <section id="projects" className="section container">
          <SectionTitle eyebrow="selected_work" title={t("Dự án nổi bật", "Selected projects")} copy={t("Những hệ thống và sản phẩm đã được xây dựng, triển khai và vận hành.", "Systems and products built, deployed, and operated.")} />
          {data.projects.length ? (
            <div className="project-grid">
              {data.projects.map((x, i) => (
                <article className={cn("project-card", i === 0 && "featured")} key={x.id} style={{ "--accent": x.accent } as React.CSSProperties}>
                  <div className="project-art">
                    {x.cover_url ? (
                      <img src={x.cover_url} alt="" />
                    ) : (
                      <>
                        <div className="project-number">0{i + 1}</div>
                        <Code2 />
                      </>
                    )}
                    <span>{formatMonthYear(x.month, x.year, lang)}</span>
                  </div>
                  <div className="project-body">
                    <div>
                      <p>
                        {t("NỔI BẬT", "FEATURED")} / {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3>{local(x, "title")}</h3>
                    </div>
                    <p>{local(x, "tagline")}</p>
                    <div className="tag-row">
                      {x.technologies.map((v) => (
                        <Badge key={v}>{v}</Badge>
                      ))}
                    </div>
                    <div className="project-links">
                      {x.live_url && (
                        <a href={x.live_url} target="_blank">
                          Live demo <ExternalLink />
                        </a>
                      )}
                      {x.source_url && (
                        <a href={x.source_url} target="_blank">
                          Source <Github />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="cms-empty standalone">{t("Chưa có dự án được xuất bản. Hãy thêm từ CMS.", "No published projects yet. Add them from the CMS.")}</p>
          )}
        </section>

        <section id="skills" className="section section-tint">
          <div className="container">
            <SectionTitle eyebrow="tech_stack" title={t("Công cụ & năng lực", "Tools & capabilities")} />
            {data.skills.length ? (
              <>
                <div className="skill-filters">
                  {categories.map((c) => (
                    <button className={filter === c ? "active" : ""} key={c} onClick={() => setFilter(c)}>
                      {c === "all" ? t("Tất cả", "All") : categoryLabel(c)}
                    </button>
                  ))}
                </div>
                <div className="skill-grid">
                  {data.skills
                    .filter((s) => filter === "all" || s.category === filter)
                    .map((s) => (
                      <div className="skill-card" key={s.id}>
                        <span>{s.icon || local(s, "name").slice(0, 2)}</span>
                        <div>
                          <strong>{local(s, "name")}</strong>
                          <small>{categoryLabel(s.category)}</small>
                        </div>
                        <p>{s.level}%</p>
                        <i>
                          <u style={{ width: `${s.level}%` }} />
                        </i>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p className="cms-empty standalone">{t("Kỹ năng sẽ được cập nhật từ CMS.", "Skills will be added through the CMS.")}</p>
            )}
            {data.soft_skills.length > 0 && (
              <>
                <h3 className="soft-title">{t("Năng lực ngoài kỹ thuật", "Beyond the code")}</h3>
                <div className="soft-grid">
                  {data.soft_skills.map((s) => {
                    const Icon = iconMap[s.icon] || Sparkles;
                    return (
                      <article key={s.id}>
                        <Icon />
                        <div>
                          <h4>{local(s, "name")}</h4>
                          <p>{local(s, "description")}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {(data.awards.length > 0 || data.certifications.length > 0) && (
          <section className="section container">
            <SectionTitle eyebrow="achievements" title={t("Dấu ấn & chứng nhận", "Awards & certifications")} />
            <div className="achievement-grid">
              {data.awards.map((a) => (
                <article key={`a${a.id}`}>
                  <Trophy />
                  <div>
                    <span>
                      {formatMonthYear(a.month, a.year, lang)} · {local(a, "issuer")}
                    </span>
                    <h3>{local(a, "title")}</h3>
                    <p>{local(a, "description")}</p>
                    {a.credential_url && (
                      <a href={a.credential_url}>
                        {t("Xem minh chứng", "View credential")} <ArrowUpRight />
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {data.certifications.map((c) => (
                <article key={`c${c.id}`}>
                  <Award />
                  <div>
                    <span>{local(c, "issuer")}</span>
                    <h3>{local(c, "name")}</h3>
                    <p>{c.credential_id && `ID: ${c.credential_id}`}</p>
                    {c.credential_url && (
                      <a href={c.credential_url}>
                        {t("Xem chứng chỉ", "View certificate")} <ArrowUpRight />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="contact" className="section contact-section">
          <div className="container contact-grid">
            <div>
              <SectionTitle eyebrow="contact.init" title={t("Có một ý tưởng? Cùng biến nó thành hiện thực.", "Have an idea? Let's make it real.")} />
              <p>{t("Mình luôn sẵn lòng trao đổi về hệ thống, hạ tầng và những cơ hội hợp tác thú vị.", "I am always open to discussing systems, infrastructure, and meaningful opportunities.")}</p>
              <a className="direct-email" href={`mailto:${p.email}`}>
                <Mail />
                {p.email}
              </a>
              <div className="contact-status">
                <i /> {t("Thường phản hồi trong vòng 24 giờ", "Usually replies within 24 hours")}
              </div>
            </div>
            <form onSubmit={submit}>
              {sent ? (
                <div className="sent-state">
                  <Check />
                  <h3>{t("Tin nhắn đã được gửi!", "Message sent!")}</h3>
                  <p>{t("Cảm ơn bạn. Mình sẽ phản hồi sớm nhất có thể.", "Thank you. I will get back to you soon.")}</p>
                  <Button type="button" variant="outline" onClick={() => setSent(false)}>
                    {t("Gửi tin khác", "Send another")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="field-row">
                    <label>
                      {t("Họ và tên", "Full name")}
                      <input name="name" maxLength={120} placeholder={t("Nguyễn Văn A", "Your name")} required />
                    </label>
                    <label>
                      Email
                      <input name="email" type="email" placeholder="hello@email.com" required />
                    </label>
                  </div>
                  <label>
                    {t("Chủ đề", "Subject")}
                    <input name="subject" maxLength={180} placeholder={t("Mình muốn trao đổi về...", "I'd like to discuss...")} required />
                  </label>
                  <label>
                    {t("Nội dung", "Message")}
                    <textarea name="message" rows={5} maxLength={3000} placeholder={t("Kể mình nghe về ý tưởng của bạn nhé...", "Tell me about your idea...")} required />
                  </label>
                  <Button size="lg" disabled={sending}>
                    {sending ? t("Đang gửi...", "Sending...") : t("Gửi tin nhắn", "Send message")}
                    <Send />
                  </Button>
                </>
              )}
            </form>
          </div>
        </section>
      </main>
      <footer className="portfolio-footer">
        <div className="container footer-main">
          <div className="footer-identity">
            <a href="#home" className="brand">
              <span>&lt;ST /&gt;</span>
              <i>portfolio.sys</i>
            </a>
            <h2>Sơn Tân</h2>
            <p>{local(p, "headline")}</p>
          </div>
          <div className="footer-contact">
            <p>{t("THÔNG TIN LIÊN HỆ", "CONTACT DETAILS")}</p>
            <div>
              <a href="mailto:tandtnt15@gmail.com">
                <Mail />
                tandtnt15@gmail.com
              </a>
              <a href="tel:+84818126177">
                <MessageSquareText />
                0818126177
              </a>
              <a href="https://linkedin.com/in/son-tan-technology/" target="_blank" rel="noreferrer">
                <Linkedin />
                LinkedIn <ArrowUpRight />
              </a>
              <a href="https://github.com/tannguyen1129" target="_blank" rel="noreferrer">
                <Github />
                GitHub <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} Sơn Tân</p>
          <div>
            <a href={`${API.replace(/\/api$/, "")}/admin/`} target="_blank">
              CMS
            </a>
            <a href="#home">
              {t("Lên đầu", "Back to top")} <ArrowUpRight />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
