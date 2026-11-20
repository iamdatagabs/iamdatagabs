import json
import os
import urllib.request
from datetime import datetime, timezone

TOKEN = os.environ["GH_TOKEN"]
HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "iamdatagabs-portfolio-metrics",
}


def get_json(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


user = get_json("https://api.github.com/users/iamdatagabs")
stars = 0
page = 1
while True:
    repos = get_json(
        f"https://api.github.com/users/iamdatagabs/repos?per_page=100&page={page}&type=owner&sort=updated"
    )
    if not repos:
        break
    stars += sum(repo.get("stargazers_count", 0) for repo in repos if not repo.get("fork", False))
    if len(repos) < 100:
        break
    page += 1

stats = {
    "public_repos": user["public_repos"],
    "stars": stars,
    "followers": user["followers"],
    "updated_at": datetime.now(timezone.utc).isoformat(),
}
with open("portfolio/github-stats.json", "w", encoding="utf-8") as file:
    json.dump(stats, file, ensure_ascii=False, indent=2)
    file.write("\n")
print(json.dumps(stats, ensure_ascii=False))
