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
