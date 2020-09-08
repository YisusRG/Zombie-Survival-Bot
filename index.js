//------------------------------------------Imports-------------------------------------------------
//Create the telegraf framework
const Telegraf = require("telegraf");
//Import extra from the telegraf framework to the caption of the images
const Extra = require("telegraf/extra");
//Import Markup from de telegraf framework to create buttons
const Markup = require("telegraf/markup");
//Import the token
const config = require("./config.json")
//Create a new instance of the telegraf framework
const bot = new Telegraf (config.token);
//Import the class for the objects
const { Shelter, Role, Leader, Builder, Vigilant, Explorer, Traitor, Refugee, Zombies } = require("./classes");
const { callbackButton } = require("telegraf/markup");

//---------------------------------------Global Variables------------------------------------------
var ChatId;
//Checked if exist an active game
var Active_game = false;
//Control the time of some events
var Chronometer;
//Layout for the survivors in the game
var Players;
//Lists to save the username and id of the players
var Players_list = [];
var Players_id = [];
//Used to help in the creation of the objects
help = [];
//Used to checked if can use the /rungame command
var Run_game = false;
//Variables for the objects
var shelter;
var leader;
var builder;
var vigilant;
var explorer;
var traitor;
var refugee;
var refugees = [];
var zombies;

//-------------------------------------Gloabal functions------------------------------------------
//This function stop the intervals
function stop(){
    clearInterval(Chronometer);
}

//This function start the chronometer to start the game
function start_game(time, ctx){
    //Set the counter that's increment every second
    let Counter = 0;
    //Use setInterval to call a function every second
    Chronometer = setInterval(function(){
        //Send a message when the counter is equal to the time divided by 2
        if (Counter == parseInt(time/2)){
            ctx.reply(`${Counter} seconds left`);
        }
        //Send a message to start the game whente the counter is equal to the time
        if(Counter == time){
            ctx.reply("Time is up to join.");
            Active_game = false;

            if(Players_list.length >= 6){
                //Send the survivors thats joined the game
                ctx.reply(Players);
                //Send the command to start the game
                ctx.reply("Use /rungame to enter the shelter");
                Run_game = true;
            }

            else{
                //Send a message that not enough survivors
                ctx.replyWithPhoto("https://cdn.pixabay.com/photo/2016/09/13/07/35/walking-dead-1666584_960_720.jpg", Extra.caption("Not enough survivors.\n\nThe zombies devoured them").markdown())
            }
            //Counter return to 0
            Counter = 0;
            //Stop the counter
            stop();
        }
        //Increase the counter
        Counter++
    }, 1000)
}

//This function call the actions of the objects
function actions(ctx){
    if(zombies.horde_days == 1){
        ctx.reply("The horde will arrive tomorrow");
    }
    else if(zombies.horde_days == 0){
        ctx.reply("the horde has arrived");
        zombies.attack(ctx, shelter);
        stop();
    }else{
        ctx.reply(`The horde will arrive in ${zombies.horde_days} days`);
    }

    leader.tasks(ctx, shelter, leader, builder, vigilant, explorer);
    builder.tasks(ctx, shelter, builder, zombies);
    vigilant.tasks(ctx, ctx.chat.id, shelter, vigilant, zombies);
    explorer.tasks(ctx, shelter, builder, explorer);
    traitor.tasks(ctx, ctx.chat.id, shelter, leader, builder, vigilant, explorer, traitor);
    refugees.forEach(
        function(refugee){
            refugee.tasks(ctx, shelter, builder, vigilant, explorer, refugee);
        }
    );

}

//This function end the day and call the function actions every 5 minutes
function play(ctx){

    Chronometer = setInterval(function(){
        zombies.end_day();
        let assault = random_number(1, 10);
        if (assault <= 2){
            if(vigilant.working == true){
                ctx.reply("As the night passed, the vigilant noticed a group of armed people in the surroundings of the shelter sou you enlisted to defend it.\n Luckily you managed to stop the attack");
            }else{
                ctx.reply("During the night a noise woke you up, you decided to investigate, only to realize that your shelter was by raided by other survivors. Unfortunately you couldn't stop them");
                ctx.reply(`Assault report:\nYou lost:\n${Math.floor(shelter.food/=2)} food units\n${Math.floor(shelter.energetics/=2)} units of energetic drinks and\n${Math.floor(builder.materials/=2)} units of building materials`);
            }
        }
        leader.working = false;
        builder.working = false;
        vigilant.working = false;
        explorer.working = false;
        traitor.working = false;
        refugees.forEach(
            function(refugee){
                refugee.working = false;
            }
        );
        actions(ctx);
    }, 300000);
}


//This function generate a random numbre between two valors
function random_number(min, max){
	return Math.floor(Math.random()*((max+1)-min)+min);
} 


//--------------------------------------------Commands----------------------------------------------

//Set the start command
bot.start((ctx) =>{
    //If the chat type is private 
    if(ctx.chat.type == "private"){
        ctx.reply(`Welcome! @${ctx.chat.username} to your zombie survival experiencie`);
    }
    //If the chat type is group or supergroup
    else{
        ctx.reply(`Welcome survivors from the \"${ctx.chat.title}\" shelter.\n\nit's time to work together to try to save your lives, are you ready?`); 
    }        
});

//Set the help command
bot.help((ctx) =>{
    ctx.reply("List of commands:\n\n/start - send a welcome message.\n/help - help about the bot.\n/newgame - create a new game.\n/rungame - run the current game.")
})


//Set de newgame command
bot.command("newgame", (ctx) => {
    //Save the chat type
    let ChatType = ctx.chat.type;

    //If the chat type is private
    if(ChatType == "private"){
        //Send a message that this command only can be used in groups or supergropus
        ctx.reply("You can use this command only in groups or supergroups");
    }
    //If the chat type is group or supergroup and there is already an active game
    else if(((ChatType == "group" || ChatType == "supergroup")) && (Active_game == false)){
        //Activate the game
        Active_game = true;
        //Return the players, id, and help lists to a empty list
        Players_list = [];
        Players_id = [];
        help = [];
        //Create the layout to the survivors list
        Players ="☠️ List of survivors:\n";

        //Send a message for them to join the game
        ctx.replyWithPhoto("https://cdn.pixabay.com/photo/2015/09/18/12/40/zombie-945622_960_720.jpg", Extra.caption("It's time for a new adventure, let's see how good you are as survivors.\n\nJoin to show your worth.\n\n120 seconds left").markdown());
        ctx.reply("Start a conversation with the bot if you haven't, then join", Markup.inlineKeyboard([
            [Markup.urlButton("Start Conversation", "https://t.me/ZSurvivalBot")],
            [Markup.callbackButton("Join", "join")]
        ]).extra());
        
        //Call the function to start the game
        start_game(120, ctx);
    //If the game is not active
    }else{
        ctx.reply("There is already an active game");
    }
});

//Set the rungame command
bot.command("rungame", (ctx) =>{
    //Save the chat type
    let ChatType = ctx.chat.type;
    ChatId = ctx.chat.id

    if(((ChatType == "group") || (ChatType == "supergroup")) && (Run_game == true)){
        //Run_game return to false
        Run_game = false;
        //Start the history
        ctx.replyWithPhoto("https://cdn.pixabay.com/photo/2017/04/25/05/17/zombies-2258609_960_720.jpg", Extra.caption("The sun goes down, your group which has managed to get out of the city for a little is almost tired and exhausted, they have been through a lot and this nigthmare is far from over, they know it's only a matter of time for a new orde to attack.\n\nYet in the distance you see a ray of hope: a new shelter. They decide to explore it and when they see thath it is empty they decide to settle there.\n\nThe next day they decide to divide up the roles to start protecting their new home"));

        //Create a new instance of the shelter class
        shelter = new Shelter();

        for(let i = 0; i < help.length; i++){
            user = random_number(0, Players_list.length-1);
            switch(i){
                case 0:
                    //Create a new instance of the leader class
                    leader = new Leader (Players_list[user], Players_id[user]);
                    leader.return_rol(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(leader.id, "https://cdn.pixabay.com/photo/2018/10/11/17/36/gothic-3740388_960_720.jpg", {caption : "You are the leader, your role is the most important.\n You must ensure the integrity of your team and the refuge, stand guard, discover who the traitor is among you and expel him from the refuge"});
                    break;
                case 1:
                    //Create a new instance of the builder class 
                    builder = new Builder (Players_list[user], Players_id[user]);
                    builder.return_rol(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(builder.id, "https://cdn.pixabay.com/photo/2017/06/23/21/56/home-2436063_960_720.jpg", {caption : "You are the builder.\nYour job is to set traps and strengthen the shelter so that it is in top condition when the horde arrives."});
                    break;
                case 2:
                    //Create a new instance of the vigilant class
                    vigilant = new Vigilant (Players_list[user], Players_id[user]);
                    vigilant.return_rol(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(vigilant.id, "https://cdn.pixabay.com/photo/2019/03/08/18/54/lamp-4042946_960_720.jpg", {caption : "You are the vigilant, good luck with that.\nYour job is to stand guard to monitor the progress of the horde and inform the inhabitants of the shelter, be careful this job can drive you crazy"});
                    break;
                case 3:
                    //Create a new instance of the explorer class
                    explorer = new Explorer (Players_list[user], Players_id[user]);
                    explorer.return_rol(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(explorer.id, "https://cdn.pixabay.com/photo/2014/06/21/21/57/apocalyptic-374208_960_720.jpg", {caption : "You are the explorer, you must be very daring or have very bad luck to have obtained this role.\nYour job is to go for resources to the city, the countryside or the surroundings. Be careful you could run into a zombie"});
                    break;
                case 4:
                    //Create a new instance of the traitor class
                    traitor = new Traitor(Players_list[user], Players_id[user]);
                    traitor.return_false_role(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(traitor.id, "https://cdn.pixabay.com/photo/2015/06/24/13/32/killer-820017_960_720.jpg", {caption : "Well this is difficult to say but you are the traitor.\nDuring the assignment of roles you were denied the right to be the leader of the shelter so you have decided to betray the inhabitants of the same.\nYour job is to steal the resources of the shelter and eliminate the inhabitants of the same to ensure your survival.\nYour objective is to eliminate the leader, but first you will have to free yourself and blame the other refugees"});
                    break; 
                default:
                    //Create a new instance of the refugee class
                    refugee = new Refugee(Players_list[user], Players_id[user]);
                    refugee.return_rol(ctx);
                    Players_list.splice(user, 1);
                    Players_id.splice(user, 1);
                    bot.telegram.sendPhoto(refugee.id, "https://cdn.pixabay.com/photo/2015/07/18/08/00/people-850097_960_720.jpg", {caption : "You are a refugee. You do not have a permanent job, but you can choose to help others to improve the shelter. Be careful if they suspect that you are a traitor they could expel you"});
                    refugees.push(refugee);
            }
        }
        
        //Create a new instance of the Zombies class
        zombies = new Zombies(); 
        
        actions(ctx);
        play(ctx);
    }
});

//-----------------------------Answers to the callback query----------------------------------------
bot.action("join", (ctx) =>{
    //Obtain the id, username and name of the user who clicked
    let UserClick = ctx.from.id;
    let Username = ctx.from.username;
    let Name = ctx.from.first_name;

    //If the id of the player is not in the list and the game is active
    if((Players_list.indexOf(Username) == -1) && (Active_game == true)){
        //Send a message that a player has joined the game
        ctx.reply(`${Name} has joined the game`);
        //Add the Username to the survivors list layout 
        Players += "@" + Username + "\n";
        //Add the username and the id of the players in a list
        Players_list.push(Username);
        Players_id.push(UserClick);
        //Add a cero to use this list later
        help.push(0);
    }
    //If the id of the player is in the list an the game is active
    else if((Players_list.indexOf(Username) != -1) && (Active_game == true)){
        bot.telegram.sendMessage(UserClick, "You have already joined the game")
    }
    //If the game is not active
    else{
        bot.telegram.sendMessage(UserClick, "Wait for an active game")
    }
});

//-------------------------------------Leader callbacks-------------------------------------------
bot.action("states-leader", (ctx) => {
    ctx.deleteMessage();
    leader.states(shelter, builder, vigilant, explorer);
    leader.tasks(ctx);
});

bot.action("eat-leader", (ctx) => {
    ctx.deleteMessage();
    leader.eat(shelter);
});

bot.action("sleep-leader", (ctx) => {
    ctx.deleteMessage();
    leader.sleep();
});

bot.action("guard-leader", (ctx) => {
    ctx.deleteMessage();
    leader.stand_guard(shelter);
});

//-------------------------------------Builder callbacks-------------------------------------------
bot.action("eat-builder", (ctx) => {
    ctx.deleteMessage();
    builder.eat(shelter);
});

bot.action("sleep-builder", (ctx) => {
    ctx.deleteMessage();
    builder.sleep();
});

bot.action("build", (ctx) => {
    ctx.deleteMessage()
    builder.build(ctx);
});

bot.action("estructures", (ctx) =>{
    ctx.deleteMessage();
    ctx.telegram.sendMessage(builder.id, "With the structures will increase the resistance of your shelter", Markup.inlineKeyboard([
        [Markup.callbackButton("Walls", "walls")],
        [Markup.callbackButton("Barricades", "barricades")],
        [Markup.callbackButton("Fences", "fences")]
    ]).extra());
});

bot.action("walls", (ctx) => {
    if(((builder.food >= 20) && (builder.energy >=20)) && (builder.material >= 30)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "Good choice");
        builder.food-=20;
        builder.energy-=20;
        builder.material-=30;
        shelter.resistence+=50;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You don't have enough energy, food or material for this structure, choose another, take a break or talk to the explorer to get materials");
        builder.tasks(ctx);
    }
});

bot.action("barricades", (ctx) => {
    if(((builder.food >= 15) && (builder.energy >= 15)) && (builder.material >= 20)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "Very good, the barricades will increase the resistance of the shelter considerably");
        builder.food-=15;
        builder.energy-=15;
        builder.material-=20;
        shelter.resistence+=30;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You don't have enough energy, food or material for this structure, choose another, take a break or talk to the explorer to get materials");
        builder.tasks(ctx);
    }
});

bot.action("fences", (ctx) => {
    if(((builder.food >= 10) && (builder.energy >= 10)) && (builder.material >= 10)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You must be tired or very sure of the resistance of your shelter since the defenses will not increase it much");
        builder.food-=10;
        builder.energy-=10;
        builder.material-=10;
        shelter.resistence+=10;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You don't have enough energy, food or material for this structure, choose another, take a break or talk to the explorer to get materials");
        builder.tasks(ctx);
    }
});


bot.action("traps", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(builder.id, "With the traps you will reduce the number of zombies thar will attack the shelter", Markup.inlineKeyboard([
        [Markup.callbackButton("Mines", "mines")],
        [Markup.callbackButton("Barbed Wire", "wire")]
    ]).extra());
});

bot.action("mines", (ctx) => {
    if(((builder.food >= 10) && (builder.energy >= 10)) && (builder.material >= 10)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "!TIME FOR THE EXPLOSIONS¡.\nThe mines will greatly reduce the number of the zombies in the horde");
        builder.food-=20;
        builder.energy-=20;
        builder.material-=30;
        zombies.quantity-=20;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You don't have enough energy, food or material for this trap, choose another, take a break or talk to the explorer to get materials");
        builder.tasks(ctx);
    }
});

bot.action("wire", (ctx) => {
    if(((builder.food >= 10) && (builder.energy >= 10)) && (builder.material >= 20)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You must be tired or very sure of the resistance of your shelter since the defenses will not increase it much");
        builder.food-=10;
        builder.energy-=10;
        builder.material-=20;
        zombies.quantity-=10;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(builder.id, "You don't have enough energy, food or material for this trap, choose another, take a break or talk to the explorer to get materials");
        builder.tasks(ctx);
    }
});
//------------------------------------Vigilant callback---------------------------------------------
bot.action("eat-vigilant", (ctx) => {
    ctx.deleteMessage();
    vigilant.eat(shelter);
});

bot.action("sleep-builder", (ctx) => {
    ctx.deleteMessage();
    vigilant.sleep();
});

bot.action("watch", (ctx) => {
    ctx.deleteMessage()
    vigilant.watch(ctx);
});

bot.action("daytime", (ctx) => {
    if((((vigilant.food >= 10) && (vigilant.energy >= 10)) && (vigilant.mental_health >= 10)) && (shelter.energetics >= 10)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "After thinking about it a lot, you realized that the status of the horde is not a priority so you decided to stand guard for the day.\nAs zombies are mostly nocturnal you will get an inaccurate aproximation of th state of the horde");
        vigilant.food-=10;
        vigilant.energy-=10;
        vigilant.mental_health-=10;
        shelter.energetics-=10
        ctx.telegram.sendMessage(ChatId, "There are: " + zombies.quantity - random_number(15, 25) + " zombies in the horde");
    }
    else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "You don't have enough food, energy, mental health or energetic drinks to for this guard, choose another, take a break or talk to the explorer to get energetic drinks");
        vigilant.tasks(ctx);
    } 
});

bot.action("nigthly", (ctx) => {
    if((((vigilant.food >= 15) && (vigilant.energy >= 15)) && (vigilant.mental_health >= 20)) && (shelter.energetics >= 15)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "Concerned about both your mental health an the state of the horde, you decide to stand guard all nigth.\nhe zombies are nocturnal although not all, so you will have a fairly close approximation to reality");
        vigilant.food-=15;
        vigilant.energy-=15;
        vigilant.mental_health-=20;
        shelter.energetics-=15;
        ctx.telegram.sendMessage(ChatId, "There are: " + zombies.quantity - random_number(5, 15) + " zombies in the horde");
    }
    else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "You don't have enough food, energy, mental health or energetic drinks to for this guard, choose another, take a break or talk to the explorer to get energetic drinks");
        vigilant.tasks(ctx);
    } 
});

bot.action("full", (ctx) => {
    if((((vigilant.food >= 20) && (vigilant.energy >= 20)) && (vigilant.mental_health >= 30)) && (shelter.energetics >= 20)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "Risking your mental health you decide to watch day and night.\n You will have the exact number of zombies that the orde has but your mental health will decrease a lot");
        vigilant.food-=20;
        vigilant.energy-=20;
        vigilant.mental_health-=30;
        shelter.energetics-=20;
        ctx.telegram.sendMessage(ChatId, "There are: " + zombies.quantity + " zombies in the horde");
    }
    else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(vigilant.id, "You don't have enough food, energy, mental health or energetic drinks to for this guard, choose another, take a break or talk to the explorer to get energetic drinks");
        vigilant.tasks(ctx);
    } 
});

//--------------------------------------Explorer callbacks-----------------------------------------
bot.action("eat-explorer", (ctx) => {
    ctx.deleteMessage();
    explorer.eat(shelter);
});

bot.action("sleep-explorer", (ctx) => {
    ctx.deleteMessage();
    explorer.sleep();
});

bot.action("explore", (ctx) => {
    ctx.deleteMessage();
    explorer.explore(ctx);
});

bot.action("City", (ctx) => {
    if((explorer.food >= 20) && (explorer.energy >= 20)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "You decided to explore the city that cost them so much to leave, you are aware of the risks but also of the rewards.\n When exploring the city the rewards in food are greater in addition to getting material for the builder and energetic drinks for the leader and the vigilant but the probability of being injured is also greater");
        explorer.hurt = random_number(1, 10);
        if(explorer.hurt <= 4){
            ctx.telegram.sendMessage(explorer.id,"In your exploration you found a large group of zombies, you managed to escape but not very unscathed");
            explorer.life-=20;
        }
        else if((explorer.hurt > 4) && (explorer.hurt <= 8)){
            ctx.telegram.sendMessage(explorer.id, "When you were back you found a few zombies, but you managed to escape with only a few hits");
            explorer.life-=10;
        }else{
            ctx.telegram.sendMessage(explorer.id, "Today you are in luck, you managed to return to the shelter unharmed, but be careful next time you may not be so lucky");
        }
        shelter.food+=60;
        shelter.energetics+=40;
        builder.material+=70;
        explorer.food-=20;
        explorer.energy-=20;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "You don't have enough energy or food to this exploration, choose another or take a brake");
        explorer.tasks(ctx);
    }            
});

bot.action("countryside", (ctx) => {
    if((explorer.food >= 10) && (explorer.energy >= 10)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "You decided not risk so much and go explore the contryside.\nBy exploring the city you will only get food. Unlike the city the reward is lower, you will not get materials or energetic drinks, but you have less probability of being injured");
        explorer.hurt = random_number(1, 10);
        if(explorer.hurt <= 2){
            ctx.telegram.sendMessage(explorer.id,"You are very unlucky.\nDuring your expedition you got a large group of zombies, you managed to escape narrowly");
            explorer.life-=20;
        }
        else if((explorer.hurt > 2) && (explorer.hurt <= 4)){
            ctx.telegram.sendMessage(explorer.id, "When you went back to the shelter some zombies attacked you, luckily you were prepared and did not suffer major damage");
            explorer.life-=10;
        }else{
            ctx.telegram.sendMessage(explorer.id, "Your exploration was somewhat boring, but luckily you did not run into any zombie");
        }
        shelter.food+=60;
        explorer.food-=10;
        explorer.energy-=10;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "You don't have enough energy or food to this exploration, choose another or take a brake");
        explorer.tasks(ctx);
    }   
});

bot.action("surroundings", (ctx) =>{
    if((explorer.food >= 10) && (explorer.energy >= 10)){
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "Today you do not feel lucky so you went to look for food in the surroundings of the shelter.\nBy searching the surroundings you will get little food but you will not be attacked");
        shelter.food+=10;
        explorer.food-=5;
        explorer.energy-=5;
    }else{
        ctx.deleteMessage();
        ctx.telegram.sendMessage(explorer.id, "You don't have enough energy or food to this exploration, choose another or take a brake");
        explorer.tasks(ctx);
    }
});

//---------------------------------------Traitor callbacks----------------------------------------
 //In case that choose food, edit hte message with the options
 bot.action("eat-explorer", (ctx) => {
    ctx.deleteMessage();
    traitor.eat(shelter);
});

bot.action("sleep-traitor", (ctx) => {
    ctx.deleteMessage();
    traitor.sleep();
});

bot.action("work-traitor", (ctx) => {
    ctx.deleteMessage();
    traitor.work(ctx, builder, vigilant, explorer);
});

bot.action("steal", (ctx) => {
    ctx.deleteMessage();
    traitor.steal(ctx, id_group, shelter, leader, builder);
});

 bot.action("food", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "You have decided to loot the cupboard of the shelter, but when you were about to start you stop to think how big will the looting be?", Markup.inlineKeyboard([
        [Markup.callbackButton("Big Looting", "big-food")],
        [Markup.callbackButton("Medium Looting", "medium-food")],
        [Markup.callbackButton("Small Looting", "small-food")]
    ]).extra());
});
//In case that chosse big looting
bot.action("big-food", (ctx) => {
    //Send a message of the selected option
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide to take all you can.\n With such a big robbery the leader is very likely to discover you");
    //Set the caught property
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    //In case of caught be less or equal than 6
    if (traitor.caught <= 6){
        //Send a message that the user was be caught
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    //Else 
    }else{
        //Send a success message
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.food-= 60;
    }
});

//In case that choose medium looting, do it the same things of big looting
bot.action("medium-food", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide not to take more than you can carry.\n With this type of theft they are less likely to catch");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);
    //But the caught probability is less
    if (traitor.caught <= 3){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.food-=30
    }
});

//In case that choose small looting, do it the same things of big looting
bot.action("small-food", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide to take only what your hands can reach.\n It's almost impossible to get caugth  with such a small robbery");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);
    //But tha caught probability is much less
    if (traitor.caught <= 1){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id , "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.food-=15;
    }
});

//In case that choose drinks
bot.action("drinks", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "Knowing that energy drinks are essential for the work of some in the shelter, you decide to take them to make them more difficult, but when you were about to start you stop to think how big will the looting be?", Markup.inlineKeyboard([
        [Markup.callbackButton("Big Looting", "big-drinks")],
        [Markup.callbackButton("Medium Looting", "medium-drinks")],
        [Markup.callbackButton("Small Looting", "small-drinks")]
    ]).extra());
});


bot.action("big-drinks", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide to take all you can.\n With such a big robbery the leader is very likely to discover you");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (traitor.caught <= 6){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.energetics -= 20
    }
});

bot.action("medium-drinks", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide not to take more than you can carry.\n With this type of theft they are less likely to catch");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (traitor.caught <= 3){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.energetics-=10
    }
});


bot.action("small-drinks", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide to take only what your hands can reach.\n It's almost impossible to get caugth  with such a small robbery");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (traitor.caught <= 1){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        this.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        shelter.energetics-=5;
    }
});

//In case that choose materials
bot.action("materials", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "to stop the progress of the shelter you dececide to steal the building materials, but when you were about to start you stop to think how big will the looting be?", Markup.inlineKeyboard([
        [Markup.callbackButton("Big Looting", "big-materials")],
        [Markup.callbackButton("Medium Looting", "medium-materials")],
        [Markup.callbackButton("Small Looting", "small-materials")]
    ]).extra());
});


bot.action("big-materials", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(this.id, "After thinking about it a lot you decide to take all you can.\n With such a big robbery the leader is very likely to discover you");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (this.caught <= 6){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        this.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        builder.material-= 20;
    }
});

bot.action("medium-material", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide not to take more than you can carry.\n With this type of theft they are less likely to catch");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (traitor.caught <= 3){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        builder.material-=10;
    }
});


bot.action("small-materials", (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(traitor.id, "After thinking about it a lot you decide to take only what your hands can reach.\n It's almost impossible to get caugth  with such a small robbery");
    leader.working == true ? traitor.caught = random_number(1, 8) : traitor.caught = random_number(1, 10);

    if (traitor.caught <= 1){
        ctx.telegram.sendMessage(traitor.id, "Bad luck, the leader caught in the act and kicked you out of the shelter, !GAME OVER FOR YOU!");
        ctx.telegram.sendMessage(ChatId, `@${traitor.name} was found stealing the shelter's resources and was expelled`);
        traitor.life = 0;
    }else{
        ctx.telegram.sendMessage(traitor.id, "¡Excellent!, made the perfect robbery, but be careful you will not always so lucky");
        builder.material-=5;
    }
});

//---------------------------------------Refugee callbacks----------------------------------------
bot.action("eat-refugee", (ctx) => {
    ctx.deleteMessage();
    refugee.eat(shelter);
});

bot.action("sleep-explorer", (ctx) => {
    ctx.deleteMessage();
    refugee.sleep();
});

bot.action("work", (ctx) => {
    ctx.deleteMessage()
    refugee.work(ctx, shelter, builder, vigilant, explorer);
});

bot.launch();