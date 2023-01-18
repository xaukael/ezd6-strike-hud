Hooks.on('renderHeadsUpDisplay', (app, $hud, dimensions)=>{
  $hud.append($(`<div id="strike-hud" style="position: relative; pointer-events: none;
  height:${dimensions.height}px; width: ${dimensions.width}px; background-color: rgba(0, 255, 0, 0); left:0px; right: 0px;"></div>`))
  for (let token of canvas.tokens.objects.children) Hooks.call('updateStrikeHud', token, true);
  if (!game.settings.get("strike-hud", "displayStrikes"))  $(`#strike-hud`).hide();
})

Hooks.on('updateStrikeHud', async (token, show)=>{
  if (!token.actor) return;
  $(`#strikes-${token.id}`).remove();
  if (!show) return;
  //while (token._animation) await new Promise((r) => setTimeout(r, 100));
  if (!game.user.isGM)
    if (token.actor.type=='monster' && !game.settings.get("strike-hud", "displayMonsterStrikesForPlayers")) return;
  $(`#strike-hud`).append($(`
  <span id="strikes-${token.id}" style="position: absolute; transform: translate(-50%, 0%); white-space:nowrap;  font-size: ${game.settings.get("strike-hud", "fontSize")}px;">${
    Array(token.actor.system.strikes.value)
    .fill('<i class="fa-solid fa-heart" style="color: red; -webkit-text-stroke: 1px black;"></i>').join('&nbsp;') +
    (token.actor.type=="character"? (token.actor.system.strikes.value<token.actor.system.strikes.max&&token.actor.system.strikes.value!=0?'&nbsp;':'') +
    Array(Math.max(token.actor.system.strikes.max-token.actor.system.strikes.value, 0))
    .fill('<i class="fa-solid fa-heart" style="color: black; -webkit-text-stroke: 1px red;"></i>').join('&nbsp;'):'')
  }</span>`));
  // replace with settings
  let offsetY = game.settings.get("strike-hud", "offsetY");
  let top = game.settings.get("strike-hud", "strikesPosition") == 'top';
  if (top) $(`#strikes-${token.id}`).css({bottom:'unset', top: `${token.y+offsetY}px`, left: `${token.x+token.w/2}px`});
  else $(`#strikes-${token.id}`).css({top: `${token.y+token.h+offsetY}px`, left: `${token.x+token.w/2}px`});

});

Hooks.on('createToken', (token)=>{
  Hooks.call('updateStrikeHud', token, true)
});

Hooks.on('refreshToken', (token)=>{
	if (token.isPreview) return;
  let offsetY = game.settings.get("strike-hud", "offsetY");
  let top = game.settings.get("strike-hud", "strikesPosition") == 'top';
  if (top) $(`#strikes-${token.id}`).css({ top: `${token.y+offsetY}px`, left: `${token.x+token.w/2}px`});
  else $(`#strikes-${token.id}`).css({top: `${token.y+token.h+offsetY}px`, left: `${token.x+token.w/2}px`});
});

Hooks.on('deleteToken', (token)=>{
  $(`#strikes-${token.id}`).remove();
});

Hooks.on('getSceneControlButtons', (controls)=>{
  controls.find(c=>c.name=='token').tools.push({
    title: 'Toggle Strikes',
    name: "strikes-toggle",
    icon: 'fas fa-heart',
    toggle: true,
    visible: true,
    active: game.settings.get("strike-hud", "displayStrikes"),
    onClick: toggled => {
      game.settings.set("strike-hud", "displayStrikes", toggled);
      if (toggled) $(`#strike-hud`).show();
      else $(`#strike-hud`).hide();
    }
  })
})

Hooks.on('updateActor', (actor, update)=>{
  if (!foundry.utils.hasProperty(update, 'system.strikes')) return;
  for (let token of actor.getActiveTokens())
    Hooks.call('updateStrikeHud', token, true)
})

Hooks.on('renderTokenHUD', (app, html)=>{
  let a = app.object.document.actor;
  let bar1attribute = app.object.document.bar1.attribute;
  html.find('div.bar1').css('position', 'relative');
  let bar1input = html.find('div.bar1 > input')
  .after($(`<a style="position:absolute; color:white; top:9px; right: 10px; font-size: 18px; pointer-events:all;"><i class="fa-solid fa-plus"></i></a>`).click(async function(e){
    e.stopPropagation();
    bar1input.val(+bar1input.val()+1);
    await a.update({[`system.${bar1attribute}.value`]: +bar1input.val()});
  }))
  .before($(`<a style="position:absolute; color:white; top:9px; left: 10px; font-size: 18px; pointer-events:all;"><i class="fa-solid fa-minus"></i></a>`).click(async function(e){
    e.stopPropagation();
    bar1input.val(+bar1input.val()-1);
    await a.update({[`system.${bar1attribute}.value`]: +bar1input.val()});
  }))
  let bar2attribute = app.object.document.bar2.attribute;
  html.find('div.bar2').css('position', 'relative');
  let bar2input = html.find('div.bar2 > input')
  .after($(`<a style="position:absolute; color:white; top:9px; right: 10px; font-size: 18px; pointer-events:all;"><i class="fa-solid fa-plus"></i></a>`).click(async function(e){
    e.stopPropagation();
    bar2input.val(+bar2input.val()+1);
    await a.update({[`system.${bar2attribute}`]: +bar2input.val()});
  }))
  .before($(`<a style="position:absolute; color:white; top:9px; left: 10px; font-size: 18px; pointer-events:all;"><i class="fa-solid fa-minus"></i></a>`).click(async function(e){
    e.stopPropagation();
    bar2input.val(+bar2input.val()-1);
    await a.update({[`system.${bar2attribute}`]: +bar2input.val()});
  }))
})

Hooks.once("init", async () => {
  
  game.settings.register('strike-hud', 'displayStrikes', {
    name: `Display Strikes`,
    hint: `Determines whether the strike HUD is visible`,
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register('strike-hud', 'strikesPosition', {
    name: `Strikes Position`,
    hint: `Position strikes relative to the top or bottom of the token.`,
    scope: "world",
    type: String,
    choices: {top: "top", bottom: "bottom"},
    default: "top",
    config: true,
    onChange: value => { 
      for (let token of canvas.tokens.objects.children) Hooks.call('updateStrikeHud', token, true);
      if (!game.settings.get("strike-hud", "displayStrikes"))  $(`#strike-hud`).hide();
    }
  });

  game.settings.register('strike-hud', 'offsetY', {
    name: `Y Offset`,
    hint: `Y offset for the hearts`,
    scope: "world",
    config: true,
    type: Number,
    default: -30,
    onChange: value => { 
      for (let token of canvas.tokens.objects.children) Hooks.call('updateStrikeHud', token, true);
      if (!game.settings.get("strike-hud", "displayStrikes"))  $(`#strike-hud`).hide();
    }
  });

  game.settings.register('strike-hud', 'fontSize', {
    name: `Font Size`,
    hint: `Font size in for the hearts in pixels`,
    scope: "world",
    config: true,
    type: Number,
    default: 30,
    onChange: value => { 
      for (let token of canvas.tokens.objects.children) Hooks.call('updateStrikeHud', token, true);
      if (!game.settings.get("strike-hud", "displayStrikes"))  $(`#strike-hud`).hide();
    }
  });

  game.settings.register('strike-hud', 'displayMonsterStrikesForPlayers', {
    name: `Display Monster Strikes For Players`,
    hint: `Determines whether the strikes of monsters are visible to players`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => { 
      for (let token of canvas.tokens.objects.children) Hooks.call('updateStrikeHud', token, true);
      if (!game.settings.get("strike-hud", "displayStrikes"))  $(`#strike-hud`).hide();
    }
  });

});