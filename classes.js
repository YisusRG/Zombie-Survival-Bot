//random_number function return a random number between a range
function random_number(min, max){
	return Math.floor(Math.random()*((max+1)-min)+min);
} 
//Create the telegraf framework
const Telegraf = require("telegraf");
//Import extra from the telegraf framework to the caption of the images
const Extra = require("telegraf/extra");
//Import Markup from de telegraf framework to create buttons
const Markup = require("telegraf/markup");
const { callbackButton } = require("telegraf/markup");
const config = require("./config.json")
//Create a new instance of the telegraf framework
const bot = new Telegraf (config.token);

//Class Shelter
class Shelter{
    constructor(){
        this.resistence = random_number(50, 100);
        this.food = random_number(60, 120);
        this.energetics = random_number(20, 60);
    }
    //This method is call when the zombies attack the shelter and check that the shelter is still standing
    destroy(ctx){
        //If the remaining resistence is equal o less than 0
        if(this.resistence <= 0){
            ctx.reply("The zombies has attacked the shelter, your defenses have not been enough to stop the horde");
        }
        //If the remaining resistence if more than 0 
        else{
            ctx.reply("CONGRATULATIONS!, thank to your efforts they have managed to stop the horde, your shelter is safe for now, keep up the good work");
            ctx.reply(`The remaining resistence of the shelter was: ${this.resistence}`);
        }        
    }
    //This method return the current status of the shelter
    state(id){
        bot.telegram.sendMessage(id, `The shelter has:\n\n${this.food} food units.\n${this.resistence} of resistence.\n${this.energetics} energetics drinks units.`);
    }

    survivors_working(leader, builder, vigilant, explorer, traitor, refugees){
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
    }
}

//The main class to create the other roles in the game
class Role{
    constructor(name, id, role, life, food, energy){
        this.name = name;
        this.id = id;
        this.role = role;
        this.life = life;
        this.food = food;
        this.energy = energy;
        this.working = false;
        this.alive = true;
    }

    return_rol(ctx){
        ctx.reply(`@${this.name} is the: ${this.role}`);
    }

    state(id){
        bot.telegram.sendMessage(id, `${this.role}:\nLife: ${this.life}\nFood: ${this.food}\nEnergy: ${this.energy}`);
    }

    eat(ctx, shelter, role){
        if((this.food < 50) || (this.energy < 50)){
            ctx.telegram.sendMessage(this.id, "You have decided to eat today to recharge your batteries");
            if((this.food + 10) <= 50){
                shelter.food-= 10;
                this.food+= 10;
            }
            else{
                shelter.food-= (50 - this.food)
                this.food+= (50 - this.food);
            }
        }else{
            ctx.telegram.sendMessage(this.id, "You are already full of food, better do another activity");
            role.tasks(ctx);
        }
    }

    sleep(ctx, role){
        if((this.energy < 50 ) || (this.energy < 50)){
            ctx.telegram.sendMessage(this.id, "You have decided to rest today to recover");
            if((this.energy + 10) <= 50){
                this.energy+=10;
            }
            else{
                this.energy+= (50 - this.energy);
            }
        }
        else{
            ctx.telegram.sendMessage(this.id, "you have the energy to the maxium, better take advantage of it in another task");
            role.tasks(ctx);
        }
    }

    still_alive(ctx, role){
        //Check if the role still alive
        if(role.life > 0){
            role.tasks(ctx);
        
        }
        //else
        else{
            //Send a messaged that has died
            if(role.alive){
                ctx.reply(`@${role.name} has died`);
                role.alive = false;
            }
        }
    }

}

//Class Leader
class Leader extends Role{
    constructor(name, id){
        super(name, id, "Leader", random_number(15, 50), random_number(15, 50), random_number(15, 50));
    }

    return_rol(ctx){
        super.return_rol(ctx);
    }
    
    state(){
        super.state(this.id);
    }

    states(shelter, builder, vigilant, explorer){
        shelter.state(this.id);
        builder.state(this.id);
        vigilant.state(this.id);
        explorer.state(this.id);
    }

    eat(ctx, shelter, role){
        super.eat(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    } 
    //This method execute the job of the leader
    stand_guard(ctx, shelter, leader){
        if(((shelter.energetics >= 10) && (this.food >= 15)) && (this.energy >= 15)){
            ctx.telegram.sendMessage(this.id, "You have decided to stand guard to be aware of what happens in the shelter at night.\n\nIf you stand guard you will have more chances to discover the traitor on the spot");
            this.food -= 15;
            this.energy -= 15;
            this.working = true;
            shelter.energetics -= 10;
            this.working = true
        }else{
            ctx.telegram.sendMessage(this.id, "The shelter does not have enough energy drinks for you to stand your guard");
            leader.tasks(ctx);
        }
    }

    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("States", "states-leader")],
            [Markup.callbackButton("Eat", "eat-leader")],
            [Markup.callbackButton("Sleep", "sleep-leader")],
            [Markup.callbackButton("Stand Guard", "guard-leader")]
        ]).extra());
    }
}

class Builder extends Role{
    constructor(name, id){
        super(name, id, "Builder", random_number(15, 50), random_number(15, 50), random_number(15, 50));
        this.material = random_number(20, 60);
    }

    return_rol(ctx){
        super.return_rol(ctx);
    }

    state(id){
        super.state(id);
    }

    eat(ctx, shelter, role){
        super.eat(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    }

    build(ctx){
        ctx.telegram.sendMessage(this.id, "You have decided that it would be best to reinforce the shelter.\n\nIt's time to decide what you want to build", Markup.inlineKeyboard([
            [Markup.callbackButton("Estructures", "estructures")],
            [Markup.callbackButton("Traps", "traps")]
        ]).extra());
    }

    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("Eat", "eat-builder")],
            [Markup.callbackButton("Sleep", "sleep-builder")],
            [Markup.callbackButton("Build", "build")]
        ]).extra());
    }
}

class Vigilant extends Role{
    constructor(name, id){
        super(name, id, "Vigilant", random_number(15, 50), random_number(15, 50), random_number(15, 50));
        this.mental_health = random_number(20, 50);
    }

    return_rol(ctx){
        super.return_rol(ctx);
    }

    state(id){
        super.state(id);
    }

    eat(ctx, shelter, role){
        super.eat(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
        this.mental_health+=20;
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    }

    watch(ctx){
        ctx.telegram.sendMessage(this.id, "You are concerned about the state of the horde, so you decide to stand guard to monitor their progress.\nHow long you will stand guard", Markup.inlineKeyboard([
            [Markup.callbackButton("Daytime", "daytime")],
            [Markup.callbackButton("Nigthly", "nigthly")],
            [Markup.callbackButton("Full Guard", "full")]
        ]).extra());
    }

    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("Eat", "eat-vigilant")],
            [Markup.callbackButton("Sleep", "sleep-vigilant")],
            [Markup.callbackButton("Watch", "watch")]
        ]).extra());
    }
}

class Explorer extends Role{
    constructor(name, id){
        super(name, id, "Explorer", random_number(15, 50), random_number(15, 50), random_number(15, 50));
        this.hurt;
    }

    return_rol(ctx){
        super.return_rol(ctx);
    }

    state(id){
        super.state(id);
    }

    eat(ctx, shelter, role){
        super.state(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    }

    explore(ctx){
        ctx.telegram.sendMessage(this.id, "bad luck for you, the shelter needs resources so you have to go exploring, but where will you go?", Markup.inlineKeyboard([
            [Markup.callbackButton("City", "city")],
            [Markup.callbackButton("Countryside", "countryside")],
            [Markup.callbackButton("Surroundings", "surroundings")]
        ]).extra());
    }

    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("Eat", "eat-explorer")],
            [Markup.callbackButton("Sleep", "sleep-explorer")],
            [Markup.callbackButton("explore", "explore")]
        ]).extra());
    }

}


class Traitor extends Role{
    constructor(name, id){
        super(name, id, "Traitor", random_number(15, 50), random_number(15, 50), random_number(15, 50));
        this.false_role = "Refugee";
        this.caught = false;
        this.job;
    }

    return_false_role(ctx){
        ctx.reply(`@${this.name} is the: ${this.false_role}`)
    }

    
    state(){
        super.state(this.id);
    }

    eat(ctx, shelter, role){
        super.eat(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    }

    work(ctx, builder, vigilant, explorer){
        ctx.telegram.sendMessage(this.id, "To avoid raising suspicions, you decide that it is best to pretend that you are working, so you will be assigned a job randomly.\nWhen you work, the beneficiary will be informed but you will not increase any statistics of the shelter");
        this.job = random_number(1, 3);

        if (this.job  == 1) {
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of a laborer, so you helped the builder with the shelter's defenses");
            ctx.telegram.sendMessage(builder.id, `@${this.name} has helped you with your work today so the shelter's defenses increased a bit`);
        }
        else if (this.job == 2){
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of guard, therefore you went to help the lookout with part of his guards");
            ctx.telegram.sendMessage(vigilant.id, `@${this.name} has helped you with part of your guards so you have not consumed so many energetic drinks`);
        }
        else{
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of a food collector, so you went around with the explorer to collect as much as you can");
            ctx.telegram.sendMessage(explorer.id, `@${this.name} has helped you with your search for resources today so the food at the shelter increased a bit`);
        }
    }

    //This method is used for reduce the shelter resources
    steal(ctx){
        //Send a message with the options to steal
        ctx.telegram.sendMessage(this.id, "Greed has led you to try to loot the shelter and then flee and leave the others to their fate.\nYou ask yourself, however, what resources to take first?", Markup.inlineKeyboard([
            [Markup.callbackButton("Food", "food")],
            [Markup.callbackButton("Energetic Drinks", "drinks")],
            [Markup.callbackButton("Materials", "materials")]
        ]).extra());
    }
    
    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("Eat", "eat-traitor")],
            [Markup.callbackButton("Sleep", "sleep-traitor")],
            [Markup.callbackButton("\"Work\"", "work-traitor")],
            [Markup.callbackButton("Steal", "steal")]
        ]).extra());
    }
}

class Refugee extends Role{
    constructor(name, id){
        super(name, id, "Refugee", random_number(15, 50), random_number(15, 50), random_number(15, 50));
    }

    return_rol(ctx){
        super.return_rol(ctx);
    }

    state(){
        super.state(this.id);
    }

    eat(ctx, shelter, role){
        super.eat(ctx, shelter, role);
    }

    sleep(ctx, role){
        super.sleep(ctx, role);
    }

    still_alive(ctx, role){
        super.still_alive(ctx, role);
    }

    work(ctx, shelter, builder, vigilant, explorer){
        ctx.telegram.sendMessage(this.id, "You have decided to be useful for the shelter and help with the tasks this will be assigned to you randomly");
        this.job = random_number(1, 3);

        if (this.job  == 1) {
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of a laborer, so you helped the builder with the shelter's defenses");
            ctx.telegram.sendMessage(builder.id, `@${this.name} has helped you with your work today so the shelter's defenses increased a bit`);
            shelter.resistence+=10;
            this.working = true;
        }
        else if (this.job == 2){
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of guard, therefore you went to help the lookout with part of his guards");
            ctx.telegram.sendMessage(vigilant.id, `@${this.name} has helped you with part of your guards so you have not consumed so many energetic drinks`);
            shelter.energetics+=5;
            this.working = true;
        }
        else{
            ctx.telegram.sendMessage(this.id, "Today you were assigned the job of a food collector, so you went around with the explorer to collect as much as you can");
            ctx.telegram.sendMessage(explorer.id, `@${this.name} has helped you with your search for resources today so the food at the shelter increased a bit`);
            shelter.food+=15;
            this.working = true;
        }
    }

    tasks(ctx){
        ctx.telegram.sendMessage(this.id, "Time to do your work. What will you do today", Markup.inlineKeyboard([
            [Markup.callbackButton("Eat", "eat-refugee")],
            [Markup.callbackButton("Sleep", "sleep-refugee")],
            [Markup.callbackButton("Work", "work")]
        ]).extra());
    }
    
}

class Zombies{
    constructor(){
        this.quantity = random_number(20, 50);
        this.attack_force = random_number(1, 4);
        this.horde_days = random_number(4, 10);
    }

    end_day(){
        this.quantity+= random_number(10, 30);
        this.horde_days-=1;
    }

    attack(ctx, shelter){
        shelter.resistence-= this.quantity*this.attack_force;
        shelter.destroy(ctx);
    }
}

module.exports = {
    Shelter,
    Role,
    Leader,
    Builder,
    Vigilant,
    Explorer,
    Traitor,
    Refugee,
    Zombies
}
