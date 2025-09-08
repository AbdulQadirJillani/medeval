import fs from "fs";
import path from "path";

export default function ArticlePage({ params }: { params: { slug: string } }) {
    const filePath = path.join(process.cwd(), "Database", `${params.slug}.html`);
    const html = fs.readFileSync(filePath, "utf-8");

    return (
        <main id="legacy" className="prose mx-auto p-6">
            {/* Inject raw HTML */}
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </main>
    );
}
