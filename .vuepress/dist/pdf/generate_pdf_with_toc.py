import json
import toml
from pdftocgen.recipe import extract_toc, Recipe
from fitzutils import ToCEntry, dump_toc, open_pdf
from pdftocio.tocio import write_toc

# requiremnets
# ----------------------------
# ruquire `pdf.tocgen` 
# https://github.com/Krasjet/pdf.tocgen
# pip install -U pdf.tocgen

# usage
# ----------------------------
# 1. make sure `pdf.tocgen` is installed
# 2. put `exportPages.json`, `sidebar.json`, `the-fenix-project.pdf` into the folder containing the script
# 3. run the script
# 4. 2 files will be generated: `the-fenix-project-with-toc.pdf` and `toc.txt`
# to apply the toc, use `pdftocio {path_to_pdf} < toc.txt`

# prepare `exportPages.json` & `sidebar.json`
#
# add the following line after line 93 in `.vuepress/plugins/export/index.js`
# replace {path_to_folder} with the path to the folder containing the script!
#
#    fs.writeFileSync("{path_to_folder}" + "/sidebar.json", JSON.stringify(sidebar));
#    fs.writeFileSync("{path_to_folder}" + "/exportPages.json", JSON.stringify(exportPages));
#    return
 

# constants & paths
# ----------------------------
pdf_path = "the-fenix-project.pdf"
toc_pdf_path = "the-fenix-project-with-toc.pdf"
final_toc_path = "toc.txt"


recipe_str = """[[heading]]
# 前端工程
level = 1
greedy = true
font.size = 26.411094665527344
font.size_tolerance = 1"""

# helpers
# -----------------------------
def remove_multiple_suffix(s, suffixes):
    triggered = True 

    while triggered:
        triggered = False
        for suffix in suffixes:
            if s.endswith(suffix):
                triggered = True
                s = s[:-len(suffix)]
                break
    return s

def normalize_path(path):
    path = path.lower()
    path = remove_multiple_suffix(path, ["/", ".md", ".html"])
    return path


def walk_tree(item, level, path_title_level_list):
    if isinstance(item, list):
        for subitem in item:
            walk_tree(subitem, level+1,path_title_level_list)
    elif isinstance(item, dict):
        # print(item)
        if "path" in item:
            path_title_level_list.append([item["path"], item["title"], level])
        else:
            path_title_level_list.append([None, item["title"], level])

        if "children" in item:
            for subitem in item["children"]:
                walk_tree(subitem, level+1,path_title_level_list)
    elif isinstance(item, str):
        path_title_level_list.append([item, None, level])

# steps
# -----------------------------

def generate_hierarchy():

    # load url & title
    with open("exportPages.json", "r", encoding="u8") as f:
        export_pages = json.load(f)

    export_pages[0]["title"] = ""

    url_to_title = {normalize_path(page["url"]):page["title"] for page in export_pages}

    # load sidebar (for hierarchy)
    with open("sidebar.json", "r", encoding="u8") as f:
        sidebar = json.load(f)

    path_title_level_list = []
    walk_tree(sidebar, 0, path_title_level_list)

    # find title for childrens in sidebar
    for idx, (path, title, level) in enumerate(path_title_level_list):
        if title is None:
            url = normalize_path(path)
            title = url_to_title[url]
        path_title_level_list[idx][1] = title

    print("load from website, length", len(path_title_level_list))

    return path_title_level_list


def find_title_pages():
    recipe = toml.loads(recipe_str)

    with open_pdf(pdf_path) as doc:
        toc = extract_toc(doc, Recipe(recipe))

    print("load from pdf, length", len(toc))

    return toc

def check_toc_length(path_title_level_list, toc):
    if len(toc) != len([i for i in path_title_level_list if i[0] is not None]):
        print("WARNING: missing some chapters, the PDF provided might not be the most up-to-date version.")
        print("警告：部分存在于网站中的章节不存在于 PDF 中。这可能是因为 PDF 构建后网站中增加了新章节。重新构建 PDF 可以解决这一问题。")



def build_final_toc(path_title_level_list, toc):
    idx1, idx2 = 0, 0
    last_page_num = 1
    final_toc = []
    for idx1, (path, title, level) in enumerate(path_title_level_list):

        title_match = "".join(title.split()) == "".join(toc[idx2].title.split())

        
        if path is None or (path is not None or title_match):
            final_toc.append(ToCEntry(level, title, toc[idx2].pagenum))

        if path is not None:
            if title_match:
                idx2 += 1
            else:
                print("missing chapter: ", title)
                final_toc.pop() # remove missing ones


    return final_toc

def save_toc(final_toc):
    with open_pdf(pdf_path) as doc:
        write_toc(doc, final_toc)
        doc.save(toc_pdf_path)

    with open(final_toc_path, "w") as f:
        f.write(dump_toc(final_toc))

# main
# -----------------------------

def main():
    path_title_level_list = generate_hierarchy()
    toc = find_title_pages()
    check_toc_length(path_title_level_list, toc)
    final_toc = build_final_toc(path_title_level_list, toc)
    save_toc(final_toc)
    

if __name__ == "__main__":
    main()

