async function loadGithub(){
  const status=document.getElementById('api-status');
  const fields={
    repos:document.getElementById('repo-count'),
    stars:document.getElementById('star-count'),
    followers:document.getElementById('follower-count')
  };
  const number=n=>new Intl.NumberFormat('pt-BR').format(n);

  function render(data,source){
    if(!Number.isFinite(data.public_repos)||!Number.isFinite(data.stars)||!Number.isFinite(data.followers)){
      throw new Error('Indicadores incompletos');
    }
    fields.repos.textContent=number(data.public_repos);
    fields.stars.textContent=number(data.stars);
    fields.followers.textContent=number(data.followers);
    const updated=data.updated_at?new Date(data.updated_at):null;
    const timestamp=updated&&!Number.isNaN(updated.getTime())
      ?' · '+updated.toLocaleString('pt-BR')
      :'';
    status.textContent=source+timestamp;
  }

  async function loadSnapshot(){
    const response=await fetch('./github-stats.json?t='+Date.now(),{cache:'no-store'});
    if(!response.ok) throw new Error('Snapshot indisponível ('+response.status+')');
    return response.json();
  }

  async function loadLiveApi(){
    const headers={'Accept':'application/vnd.github+json'};
    const userResponse=await fetch('https://api.github.com/users/iamdatagabs',{headers,cache:'no-store'});
    if(!userResponse.ok) throw new Error('GitHub API (perfil): '+userResponse.status);
    const user=await userResponse.json();

    let stars=0;
    let page=1;
    while(true){
      const response=await fetch(
        'https://api.github.com/users/iamdatagabs/repos?per_page=100&page='+page+'&type=owner&sort=updated',
        {headers,cache:'no-store'}
      );
      if(!response.ok) throw new Error('GitHub API (repositórios): '+response.status);
      const repos=await response.json();
      stars+=repos.reduce((total,repo)=>total+(repo.fork?0:(repo.stargazers_count||0)),0);
      if(repos.length<100) break;
      page+=1;
    }

    return {
      public_repos:user.public_repos,
      stars,
      followers:user.followers,
      updated_at:new Date().toISOString()
    };
  }

  try{
    const data=await loadSnapshot();
    render(data,'Dados sincronizados');
  }catch(snapshotError){
    console.warn('Snapshot do GitHub indisponível; usando API pública:',snapshotError);
    try{
      const data=await loadLiveApi();
      render(data,'Dados ao vivo via GitHub API');
    }catch(apiError){
      status.textContent='Não foi possível carregar os indicadores';
      Object.values(fields).forEach(field=>field.textContent='—');
      console.error('Falha ao carregar indicadores do GitHub:',apiError);
    }
  }
}

loadGithub();
\n
async function loadRepositoryCatalog(){
  const container=document.getElementById('repository-catalog');
  const status=document.getElementById('repository-status');
  const search=document.getElementById('repository-search');
  if(!container||!status) return;
  const lang=document.documentElement.lang==='en'?'en':'pt-BR';
  const fmtDate=value=>{
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat(lang,{year:'numeric',month:'short'}).format(date);
  };
  try{
    const response=await fetch('https://api.github.com/users/iamdatagabs/repos?per_page=100&type=owner&sort=updated',{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!response.ok) throw new Error('GitHub API: '+response.status);
    const repos=(await response.json()).filter(repo=>!repo.fork&&repo.visibility!=='private').sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
    const render=()=>{
      const query=(search?.value||'').trim().toLocaleLowerCase();
      const visible=repos.filter(repo=>[repo.name,repo.description,repo.language].filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
      container.replaceChildren();
      visible.forEach(repo=>{
        const card=document.createElement('article');card.className='repository-item';
        const heading=document.createElement('h3');const link=document.createElement('a');link.href=repo.html_url;link.target='_blank';link.rel='noreferrer';link.textContent=repo.name;heading.append(link);
        const description=document.createElement('p');description.textContent=repo.description||(lang==='en'?'No description provided.':'Sem descrição cadastrada.');
        const meta=document.createElement('div');meta.className='repository-meta';
        [repo.language,fmtDate(repo.updated_at),((repo.stargazers_count||0)+' ★')].filter(Boolean).forEach(value=>{const span=document.createElement('span');span.textContent=value;meta.append(span)});
        card.append(heading,description,meta);container.append(card);
      });
      status.textContent=lang==='en'?visible.length+' of '+repos.length+' public repositories':visible.length+' de '+repos.length+' repositórios públicos';
    };
    search?.addEventListener('input',render);
    render();
  }catch(error){
    status.textContent=lang==='en'?'Could not load the live catalog. Browse all repositories on GitHub.':'Não foi possível carregar o catálogo ao vivo. Consulte todos os repositórios no GitHub.';
    console.warn('Repository catalog unavailable:',error);
  }
}
\nloadRepositoryCatalog();\n