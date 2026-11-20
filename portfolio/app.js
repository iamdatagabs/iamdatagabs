async function loadGithub(){
  const status=document.getElementById('api-status');
  const fields={repos:document.getElementById('repo-count'),stars:document.getElementById('star-count'),followers:document.getElementById('follower-count')};
  const number=n=>new Intl.NumberFormat('pt-BR').format(n);
  try{
    const response=await fetch('./github-stats.json?t='+Date.now(),{cache:'no-store'});
    if(!response.ok) throw new Error('Arquivo de indicadores indisponível');
    const data=await response.json();
    if(!Number.isFinite(data.public_repos)||!Number.isFinite(data.stars)||!Number.isFinite(data.followers)) throw new Error('Indicadores incompletos');
    fields.repos.textContent=number(data.public_repos);
    fields.stars.textContent=number(data.stars);
    fields.followers.textContent=number(data.followers);
    const updated=data.updated_at?new Date(data.updated_at):null;
    status.textContent=updated&&!Number.isNaN(updated.getTime())?'Dados sincronizados · '+updated.toLocaleString('pt-BR'):'Dados sincronizados';
  }catch(error){
    status.textContent='Não foi possível carregar os indicadores';
    Object.values(fields).forEach(field=>field.textContent='—');
    console.error('Falha ao carregar indicadores do GitHub:',error);
  }
}
loadGithub();
