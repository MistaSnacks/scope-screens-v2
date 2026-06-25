# scripts/build-alt-cms-guide.py
# Generates the Scope Screenings ALT (multipage) CMS editor guide as a .docx.
# Brand-styled: Aachen Bold rust headings, Libre Franklin body.
# Screenshots come from .shots/guide/alt/<key>.png (see .shots/capture-alt-cms-guide.mjs).
import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(_ROOT, ".shots/guide/alt")

RUST = RGBColor(0xB1, 0x3A, 0x2A)
INK = RGBColor(0x14, 0x12, 0x10)
GREY = RGBColor(0x55, 0x50, 0x4A)


def style_run(r, font="Libre Franklin", size=10.5, bold=False, color=INK):
    r.font.name = font
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color


def heading(doc, text, size=14):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    style_run(p.add_run(text), font="Aachen Bold", size=size, color=RUST)
    return p


def para(doc, text, color=INK, size=10.5, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    style_run(p.add_run(text), size=size, color=color)
    return p


def bullet(doc, text, label=None):
    p = doc.add_paragraph(style="List Bullet")
    if label:
        style_run(p.add_run(label + ": "), bold=True)
    style_run(p.add_run(text))


def legend_line(doc, n, name, desc):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(1)
    style_run(p.add_run(f"{n}  "), bold=True, color=RUST, size=11)
    style_run(p.add_run(name), bold=True)
    style_run(p.add_run(" - " + desc))


def optional_image(doc, filename, caption=None, missing_note=None):
    """Embed .shots/guide/alt/<filename> if present; otherwise leave a labelled
    placeholder so the slot is obvious until the screenshot is dropped in."""
    img = os.path.join(SHOTS, filename)
    if os.path.exists(img):
        doc.add_picture(img, width=Inches(6.5))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.paragraphs[-1].paragraph_format.space_after = Pt(3)
        if caption:
            c = doc.add_paragraph()
            c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            c.paragraph_format.space_after = Pt(6)
            style_run(c.add_run(caption), size=9, color=GREY)
    elif missing_note:
        n = doc.add_paragraph()
        n.paragraph_format.space_after = Pt(6)
        style_run(n.add_run(missing_note), size=9, color=GREY)


# Page sections: (key, route, page_title, collections_note, legend_items, also_note)
PAGE_SECTIONS = [
    (
        "home",
        "/",
        "Homepage",
        "Forms: Hero  +  BuiltForAccess  +  Footer",
        [
            ("1", "Hero - Eyebrow", 'small label above the curtain (e.g. "Feature Presentation").'),
            ("2", "Hero - Poster image", "the still shown before/behind the video. Upload in Media Manager."),
            ("3", "Hero - Video", "the background reel. Upload or select in Media Manager."),
            ("4", "BuiltForAccess - Title", "the Founder band heading (line break OK)."),
            ("5", "BuiltForAccess - Founder quote", "the large blockquote."),
            ("6", "Footer - Sign-off heading", "the big closing line."),
        ],
        'The big "Scope Screenings" wordmark and tagline in the hero are fixed in the design. '
        "See the Hero and BuiltForAccess sections below for the full field lists.",
    ),
    (
        "about",
        "/about",
        "About Page  (/about)",
        "Form: AboutPage  +  BuiltForAccess  +  Lists: Houses  +  Timeline",
        [
            ("1", "AboutPage - Eyebrow", "small label at the top of the page header."),
            ("2", "AboutPage - Title", "the main page heading (line breaks OK)."),
            ("3", "AboutPage - Lede", "the introductory paragraph under the title."),
            ("4", "BuiltForAccess - Founder quote", "the Founder band (shared with homepage)."),
            ("5", "Houses (list)", 'the "The Houses" venue cards -- one row per venue.'),
            ("6", "Timeline (list)", 'the "How We Got Here" history items -- one row per year.'),
        ],
        "The /about page has no closing call-to-action band -- its closing fields in the form are unused.",
    ),
    (
        "schedule",
        "/schedule",
        "Schedule Page  (/schedule)",
        "Form: SchedulePage",
        [
            ("1", "Eyebrow", "small label at the top of the page header."),
            ("2", "Title", "the main heading for the schedule page."),
            ("3", "Lede", "the introductory paragraph."),
            ("4", "Closing title", "the heading in the bottom call-to-action band."),
            ("5", "Closing body", "the paragraph in the bottom band."),
            ("6", "Closing button + link", "the CTA button label and where it goes."),
        ],
        "The schedule grid and event dates come straight from Wix Events -- manage those where you sell "
        "tickets. The CMS only controls the surrounding words.",
    ),
    (
        "tickets",
        "/tickets",
        "Tickets Page  (/tickets)",
        "Form: TicketsPage",
        [
            ("1", "Eyebrow", "small label at the top of the page header."),
            ("2", "Title", "the main heading for the tickets page."),
            ("3", "Lede", "the introductory paragraph."),
            ("4", "Why title", 'heading of the "Why a season pass" block.'),
            ("5", "Why body", 'body copy in the "Why a season pass" block.'),
            ("6", "Closing title / body / button / link", "the bottom call-to-action band."),
        ],
        "Ticket checkout is handled by Wix Events -- the CMS only controls the words around it.",
    ),
    (
        "submit",
        "/submit",
        "Submit Page  (/submit)",
        "Form: SubmitPage  +  Lists: SubmitCriteria  +  SubmitSteps  +  SubmitDeadlines",
        [
            ("1", "Eyebrow", "small label at the top of the page header."),
            ("2", "Title", "the main heading for the submit page."),
            ("3", "Lede", "the introductory paragraph."),
            ("4", "SubmitCriteria (list)", '"What We\'re After" cards -- one row per criterion (N, Title, Blurb).'),
            ("5", "SubmitSteps (list)", '"Three Steps In" cards -- one row per step (N, Title, Blurb).'),
            ("6", "SubmitDeadlines (list)", "the deadlines table rows -- Name, Closes, Fee."),
            ("7", "Closing title / body / button / link", "the bottom call-to-action band."),
        ],
        "The live submission purchase flow is not in the CMS. SubmitDeadlines controls the display copy "
        "only -- update it to reflect the actual dates set on FilmFreeway.",
    ),
    (
        "support",
        "/support",
        "Support Page  (/support)",
        "Form: SupportPage  +  List: GivingTiers",
        [
            ("1", "Eyebrow", "small label at the top of the page header."),
            ("2", "Title", "the main heading for the support page."),
            ("3", "Lede", "the introductory paragraph."),
            ("4", "Card label", 'the label on the "Give Today" donation card.'),
            ("5", "Card body", 'the body copy on the "Give Today" card.'),
            ("6", "Donate URL", "where the donate button links (update if fiscal sponsor changes)."),
            ("7", "GivingTiers (list)", "the giving levels -- Name, Amount, Cadence, Perks, Featured."),
            ("8", "Closing title / body / button / link", "the bottom call-to-action band."),
        ],
        None,
    ),
]

# Shared form sections: (title, collections_note, legend_items, also_note)
SHARED_SECTIONS = [
    (
        "Hero -- Shared Form",
        "Form: Hero",
        [
            ("1", "Eyebrow", "small label above the opening curtain."),
            ("2", "Poster image", "the still shown before the video plays -- upload in Wix Media Manager."),
            ("3", "Video", "the background reel -- upload or select a video in Wix Media Manager."),
        ],
        'The big "Scope / Screenings" wordmark and tagline are fixed in the design and are not in the CMS.',
    ),
    (
        "BuiltForAccess -- Shared Form",
        "Form: BuiltForAccess  (used on homepage + /about)",
        [
            ("1", "Title", "the Founder band heading (line break allowed)."),
            ("2", "Founder quote", "the large blockquote."),
            ("3", "Founder name", "shown on the photo frame and beside the quote."),
            ("4", "Founder title", "the role line under the name."),
            ("5", "Founder credential", "the credential line (e.g. festival founder)."),
            ("6", "Founder photo", "upload in the Wix Media Manager; leave empty for the built-in default."),
        ],
        None,
    ),
    (
        "Footer -- Shared Form",
        "Form: Footer  (used on every page)",
        [
            ("1", "Sign-off heading", "the big closing line in the footer."),
            ("2", "Newsletter heading", "the text above the email sign-up."),
            ("3", "Tagline", "the paragraph line in the footer."),
            ("4", "Copyright", "the line at the very bottom."),
            ("5", "Contact email", "the contact address shown in the footer."),
        ],
        None,
    ),
]

# List collections: (title, description, fields)
LIST_SECTIONS = [
    (
        "Houses  (list)",
        'The venue cards on /about -- "The Houses" section. One row per venue.',
        [
            ("Name", "the venue name."),
            ("Eyebrow", "the small label above the name."),
            ("Address", "the venue address."),
            ("Blurb", "the short description paragraph."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "Timeline  (list)",
        'The history items on /about -- "How We Got Here". One row per milestone.',
        [
            ("Year", "the year label."),
            ("Title", "the milestone heading."),
            ("Blurb", "the description paragraph."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "GivingTiers  (list)",
        "The giving levels on /support. One row per tier.",
        [
            ("Name", "the tier name (e.g. Friend, Supporter)."),
            ("Amount", "the dollar amount."),
            ("Cadence", "e.g. /year, /month."),
            ("Perks", "one perk per line inside the field."),
            ("Featured", "check to highlight this tier visually."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "SubmitCriteria  (list)",
        '"What We\'re After" cards on /submit. One row per criterion.',
        [
            ("N", "the display number."),
            ("Title", "the criterion heading."),
            ("Blurb", "the description paragraph."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "SubmitSteps  (list)",
        '"Three Steps In" cards on /submit. One row per step.',
        [
            ("N", "the display number."),
            ("Title", "the step heading."),
            ("Blurb", "the description paragraph."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "SubmitDeadlines  (list)",
        "The deadlines table on /submit. One row per deadline.",
        [
            ("Name", "the deadline label (e.g. Early Bird)."),
            ("Closes", "the closing date (display text)."),
            ("Fee", "the submission fee (display text)."),
            ("Order", "lower numbers show first."),
        ],
    ),
    (
        "Nav  (list)",
        "The top navigation menu, shared across all pages.",
        [
            ("Label", "the link text shown in the menu."),
            ("Href", "the URL or path the link points to."),
            ("Order", "lower numbers appear first in the menu."),
            ("Hidden", "check to remove this item from the menu without deleting it."),
        ],
    ),
]


def main():
    doc = Document()
    for s in doc.sections:
        s.top_margin = s.bottom_margin = Inches(0.6)
        s.left_margin = s.right_margin = Inches(0.7)

    # Cover
    logo = os.path.join(_ROOT, "public/popcorn-logo.png")
    if os.path.exists(logo):
        doc.add_picture(logo, height=Inches(0.7))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    h = doc.add_paragraph()
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(h.add_run("Editing Your Website Content"), font="Aachen Bold", size=24, color=RUST)
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(sub.add_run("A visual guide to the Scope Screenings site (multipage)"), size=12, color=GREY)

    # The one rule
    heading(doc, "The one rule")
    para(
        doc,
        "Open the CMS in your Wix dashboard -> pick the collection for the part of the page you want to "
        "change -> edit the fields -> click Publish. Your live site updates within the hour. "
        "If you leave a field blank, the built-in default shows -- nothing breaks.",
    )

    # Opening the CMS
    heading(doc, "Opening the CMS")
    bullet(doc, "Sign in at wix.com and open this site's Dashboard.", label="1")
    bullet(
        doc,
        'In the left-hand menu choose CMS. (On some plans it sits under "Dev Mode" or '
        '"Developer Tools", and it was previously called "Content Manager".)',
        label="2",
    )
    bullet(doc, "You'll land on the list of collections -- one folder per part of the site. Click any collection to open it.", label="3")
    bullet(doc, "Edit the fields, then click Publish (top-right) to push it live.", label="4")

    # How it's organized
    heading(doc, "How it's organized")
    para(
        doc,
        'This is the multipage version of the site. Each page has its own collection (a "Page form") that '
        "controls its header text and closing call-to-action. Three forms are shared across every page: "
        "Hero (the homepage curtain), BuiltForAccess (the Founder band), and Footer. "
        "Repeating items -- venues, history, giving tiers, nav links, and so on -- live in their own lists, "
        "one row per item.",
    )

    # Collections at a glance
    heading(doc, "Your collections at a glance")
    para(doc, "Page forms (one card each):", color=INK, size=10.5, space_after=2)
    bullet(doc, "the /about page header and Hidden toggle.", label="AboutPage")
    bullet(doc, "the /schedule page header, closing band, and Hidden toggle.", label="SchedulePage")
    bullet(doc, 'the /tickets page header, "Why a season pass" block, closing band, and Hidden toggle.', label="TicketsPage")
    bullet(doc, "the /submit page header, closing band, and Hidden toggle.", label="SubmitPage")
    bullet(doc, 'the /support page header, "Give Today" card, closing band, and Hidden toggle.', label="SupportPage")

    para(doc, "Shared forms:", color=INK, size=10.5, space_after=2)
    bullet(doc, "the homepage opening curtain -- eyebrow, poster image, background video.", label="Hero")
    bullet(doc, "the Founder band -- quote, name, title, photo. Appears on homepage and /about.", label="BuiltForAccess")
    bullet(doc, "the site footer on every page -- sign-off, newsletter heading, tagline, copyright, contact.", label="Footer")

    para(doc, "Lists (one row per item; Order controls display sequence):", color=INK, size=10.5, space_after=2)
    bullet(doc, "the /about venue cards.", label="Houses")
    bullet(doc, "the /about history items.", label="Timeline")
    bullet(doc, "the /support giving levels.", label="GivingTiers")
    bullet(doc, '"What We\'re After" cards on /submit.', label="SubmitCriteria")
    bullet(doc, '"Three Steps In" cards on /submit.', label="SubmitSteps")
    bullet(doc, "the deadlines table on /submit.", label="SubmitDeadlines")
    bullet(doc, "the top navigation menu -- label, href, order, hidden.", label="Nav")

    # -- Per-page sections
    for key, route, title, collections_note, items, also in PAGE_SECTIONS:
        doc.add_page_break()
        heading(doc, title)
        cn = doc.add_paragraph()
        cn.paragraph_format.space_after = Pt(6)
        style_run(cn.add_run(collections_note), size=9.5, bold=True, color=GREY)
        optional_image(
            doc,
            f"{key}.png",
            caption=f"The {route} page -- numbered fields show what each CMS entry controls.",
            missing_note=f"[ Screenshot: {route} -- save as .shots/guide/alt/{key}.png ]",
        )
        for n, name, desc in items:
            legend_line(doc, n, name, desc)
        if also:
            a = doc.add_paragraph()
            a.paragraph_format.space_before = Pt(4)
            style_run(a.add_run(also), size=10, color=GREY)

    # -- Shared form sections
    doc.add_page_break()
    heading(doc, "Shared Forms", size=16)
    para(
        doc,
        "These three forms appear across multiple pages -- edit them once and every page updates.",
    )

    for title, collections_note, items, also in SHARED_SECTIONS:
        heading(doc, title)
        cn = doc.add_paragraph()
        cn.paragraph_format.space_after = Pt(6)
        style_run(cn.add_run(collections_note), size=9.5, bold=True, color=GREY)
        for n, name, desc in items:
            legend_line(doc, n, name, desc)
        if also:
            a = doc.add_paragraph()
            a.paragraph_format.space_before = Pt(4)
            style_run(a.add_run(also), size=10, color=GREY)

    # -- List collections
    doc.add_page_break()
    heading(doc, "List Collections", size=16)
    para(
        doc,
        "Each list below holds one row per item. Add, remove, or reorder rows freely. "
        "Every row has an Order number -- lower numbers show first on the page.",
    )

    for title, description, fields in LIST_SECTIONS:
        heading(doc, title)
        para(doc, description, color=GREY, size=10)
        for name, desc in fields:
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1)
            style_run(p.add_run(name + ": "), bold=True)
            style_run(p.add_run(desc))

    # -- Show or hide a page
    doc.add_page_break()
    heading(doc, "Show or hide a page")
    para(
        doc,
        "Each page's form has a Hidden checkbox. Check it and click Publish -- "
        "visitors will see a \"not found\" page instead. Uncheck it to bring the page back. "
        "Hidden is unchecked by default, so all pages are live.",
    )
    bullet(
        doc,
        "Open the page's form (e.g. AboutPage, SchedulePage) -> check the Hidden box -> Publish.",
        label="To hide",
    )
    bullet(doc, "Open the same form -> uncheck Hidden -> Publish.", label="To restore")
    para(
        doc,
        "The Nav list controls the top menu independently -- you can hide a nav item by checking Hidden on "
        "its Nav row without taking the page itself offline (and vice versa).",
    )
    para(
        doc,
        "To fully retire a page: check Hidden in the page's form AND check Hidden on its Nav row. "
        "Both changes need a Publish to take effect.",
        color=GREY,
        size=10,
    )

    # -- Photos & video
    heading(doc, "Photos and video")
    bullet(
        doc,
        "In any Image or Video field, upload or select in the Wix Media Manager. "
        "Leave the field empty and the built-in default shows -- nothing breaks.",
    )
    bullet(
        doc,
        "Hero Poster image and BuiltForAccess Founder photo both work this way.",
    )
    bullet(
        doc,
        "Hero Video is the background reel on the homepage -- upload an MP4 or select an existing video "
        "in the Media Manager.",
    )

    # -- Leave these alone
    heading(doc, "Leave these alone (they update themselves)")
    bullet(
        doc,
        "Tickets checkout and the Schedule dates come straight from Wix Events -- manage those where you "
        "already sell tickets. The CMS only controls the surrounding words on those pages.",
    )
    bullet(
        doc,
        "SubmitDeadlines controls the display copy on /submit -- update it to match your actual FilmFreeway "
        "dates, but the live purchase flow is outside the CMS.",
    )

    # -- Good to know
    heading(doc, "Good to know")
    bullet(doc, "Every list row has an Order number -- lower numbers show first.")
    bullet(
        doc,
        "Need a line break inside a field (e.g. a two-line title)? Press Enter or Shift+Enter inside the "
        "field to add the break.",
    )
    bullet(doc, "Don't see your change on the live site? Give it up to an hour, or republish.")
    bullet(
        doc,
        "Nav Hidden lets you soft-remove a menu item without deleting the row -- useful for pages under "
        "construction.",
    )

    out = os.path.join(_ROOT, "docs/Scope-Screenings-ALT-CMS-Guide.docx")
    doc.save(out)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
