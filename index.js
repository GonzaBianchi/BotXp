// index.js
import { Client, GatewayIntentBits, EmbedBuilder, Collection, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import { addXp, calculateLevelXp, getUserRank, removeXp, setLevelAndXp } from './utils/xpSystem.js';
import { updateMemberRoles, LEVEL_ROLES } from './utils/roleManager.js';
import dotenv from 'dotenv';

dotenv.config();

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Registro de comandos slash
const commands = [
  new SlashCommandBuilder()
    .setName('nivel')
    .setDescription('Muestra tu nivel y XP actual'),
  new SlashCommandBuilder()
    .setName('top')
    .setDescription('Muestra el ranking de usuarios con más XP en el servidor')
    .addIntegerOption(option => 
      option.setName('cantidad')
        .setDescription('Número de usuarios a mostrar (máximo 10)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Muestra información sobre el sistema de niveles'),
  
  // Nuevos comandos administrativos
  new SlashCommandBuilder()
    .setName('agregaxp')
    .setDescription('Agrega XP a un usuario específico (solo administradores)')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario al que agregar XP')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('cantidad')
        .setDescription('Cantidad de XP a agregar')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('quitaxp')
    .setDescription('Quita XP a un usuario específico (solo administradores)')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario al que quitar XP')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('cantidad')
        .setDescription('Cantidad de XP a quitar')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('establecernivel')
    .setDescription('Establece un nivel y XP específicos para un usuario (solo administradores)')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario al que establecer nivel y XP')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('nivel')
        .setDescription('Nivel a establecer')
        .setRequired(true)
        .setMinValue(1))
    .addIntegerOption(option => 
      option.setName('xp')
        .setDescription('XP a establecer (opcional)')
        .setRequired(false)
        .setMinValue(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Administra los roles de nivel')
    .addSubcommand(subcommand =>
      subcommand
        .setName('verificar')
        .setDescription('Verifica si todos los roles de nivel existen en el servidor'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('Crea los roles de nivel faltantes en el servidor'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sincronizar')
        .setDescription('Sincroniza los roles de todos los usuarios según su nivel actual'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
  
  // Registrar los comandos slash
  try {
    console.log('⏳ Registrando comandos slash...');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log('✅ Comandos slash registrados correctamente');
    
  } catch (error) {
    console.error('❌ Error registrando comandos slash:', error);
  }
});

// XP por mensaje (con cooldown para evitar spam)
const cooldowns = new Map();
const COOLDOWN_TIME = 60000; // 1 minuto de cooldown

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  const userId = message.author.id;
  const guildId = message.guild.id;
  
  // Verificar cooldown
  const userCooldownKey = `${userId}-${guildId}`;
  if (cooldowns.has(userCooldownKey)) {
    const cooldownEnd = cooldowns.get(userCooldownKey);
    if (Date.now() < cooldownEnd) return;
  }
  
  // Calcular XP aleatorio entre 15-25
  const xpAmount = Math.floor(Math.random() * 11) + 15;
  
  // Obtener datos anteriores
  const oldUser = await User.findOne({ userId, guildId });
  const oldLevel = oldUser ? oldUser.level : 1;
  
  // Añadir XP
  const user = await addXp(userId, guildId, xpAmount);
  
  // Establecer cooldown
  cooldowns.set(userCooldownKey, Date.now() + COOLDOWN_TIME);
  
  // Mensaje de subida de nivel
  if (user.level > oldLevel) {
    const levelUpEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎉 ¡Subida de nivel!')
      .setDescription(`¡Felicidades ${message.author}! Has subido al nivel **${user.level}**`)
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: 'Sistema de niveles' })
      .setTimestamp();
    
    message.channel.send({ embeds: [levelUpEmbed] });
    
    // Actualizar roles si corresponde
    try {
      const roleResult = await updateMemberRoles(message.member, user.level);
      
      // Si se añadió un nuevo rol, notificarlo
      if (roleResult.success && roleResult.added) {
        const roleEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏅 ¡Nuevo Rango Obtenido!')
          .setDescription(`¡Felicidades ${message.author}! Has desbloqueado el rango **${roleResult.added}**`)
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: 'Sistema de rangos' })
          .setTimestamp();
        
        message.channel.send({ embeds: [roleEmbed] });
      }
    } catch (error) {
      console.error('Error actualizando roles:', error);
    }
  }
});

// Manejar comandos slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const { commandName, user, guildId } = interaction;
  
  // Verificar que esté en un servidor
  if (!guildId) {
    return interaction.reply({ 
      content: '❌ Este comando solo puede usarse en un servidor', 
      ephemeral: true 
    });
  }
  
  switch (commandName) {
    case 'nivel': {
      await interaction.deferReply();
      
      try {
        const userData = await User.findOne({ userId: user.id, guildId });
        
        if (!userData) {
          return interaction.editReply('❌ Aún no tienes XP. ¡Envía algunos mensajes para empezar!');
        }
        
        const { level, xp } = userData;
        const xpForNextLevel = calculateLevelXp(level);
        const rank = await getUserRank(user.id, guildId);
        
        // Crear un embed con el nivel del usuario
        const embed = new EmbedBuilder()
          .setColor('#4287f5')
          .setTitle(`📊 Nivel de ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: 'Nivel', value: `${level}`, inline: true },
            { name: 'XP', value: `${xp}/${xpForNextLevel}`, inline: true },
            { name: 'Ranking', value: `#${rank}`, inline: true }
          )
          .setFooter({ text: `${Math.floor((xp / xpForNextLevel) * 100)}% para el siguiente nivel` })
          .setTimestamp();
          
        // Barra de progreso de XP
        const progress = Math.floor((xp / xpForNextLevel) * 20);
        const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
        
        embed.setDescription(`Progreso: [${progressBar}]`);
        
        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al obtener nivel:', error);
        interaction.editReply('❌ Ocurrió un error al obtener tu nivel');
      }
      break;
    }
    
    case 'top': {
      await interaction.deferReply();
      
      try {
        const limit = interaction.options.getInteger('cantidad') || 5;
        
        if (limit > 10) {
          return interaction.editReply('❌ El máximo de usuarios a mostrar es 10');
        }
        
        // Buscar los usuarios con más XP en este servidor
        const topUsers = await User.find({ guildId })
          .sort({ level: -1, xp: -1 })
          .limit(limit);
          
        if (topUsers.length === 0) {
          return interaction.editReply('❌ No hay usuarios con XP en este servidor aún');
        }
        
        // Crear embed para el ranking
        const embed = new EmbedBuilder()
          .setColor('#ffd700')
          .setTitle(`🏆 Top ${topUsers.length} usuarios con más nivel`)
          .setFooter({ text: 'Sistema de niveles' })
          .setTimestamp();
          
        // Obtener nombres de usuario y añadirlos al embed
        for (let i = 0; i < topUsers.length; i++) {
          const userData = topUsers[i];
          try {
            const member = await interaction.guild.members.fetch(userData.userId);
            const username = member ? member.user.username : 'Usuario Desconocido';
            
            embed.addFields({
              name: `#${i + 1} ${username}`,
              value: `Nivel ${userData.level} (${userData.xp} XP)`
            });
          } catch (error) {
            console.error(`Error obteniendo usuario ${userData.userId}:`, error);
            embed.addFields({
              name: `#${i + 1} Usuario Desconocido`,
              value: `Nivel ${userData.level} (${userData.xp} XP)`
            });
          }
        }
        
        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al obtener top usuarios:', error);
        interaction.editReply('❌ Ocurrió un error al obtener el ranking');
      }
      break;
    }
    
    case 'info': {
      const xpLevel1 = calculateLevelXp(1);
      const xpLevel5 = calculateLevelXp(5);
      const xpLevel10 = calculateLevelXp(10);
      
      // Crear una lista de roles por nivel
      let rolesInfo = '';
      for (const role of LEVEL_ROLES) {
        rolesInfo += `- Nivel ${role.minLevel}+: **${role.roleName}**\n`;
      }
      
      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('ℹ️ Sistema de Niveles')
        .setDescription('Información sobre cómo funciona el sistema de XP y niveles')
        .addFields(
          { 
            name: '📝 Cómo ganar XP', 
            value: 'Ganas entre 15-25 XP por cada mensaje que envías en el servidor (con un cooldown de 1 minuto para evitar spam)' 
          },
          { 
            name: '⬆️ Subir de nivel', 
            value: `Para subir al nivel siguiente necesitas acumular XP según la fórmula: 5×(nivel²) + 50×nivel + 100\n\nEjemplos:\n- Nivel 1 → ${xpLevel1} XP\n- Nivel 5 → ${xpLevel5} XP\n- Nivel 10 → ${xpLevel10} XP` 
          },
          { 
            name: '🏅 Rangos por nivel', 
            value: rolesInfo
          },
          { 
            name: '📊 Comandos disponibles', 
            value: '`/nivel` - Ver tu nivel actual\n`/top [cantidad]` - Ver el ranking de usuarios' 
          },
          {
            name: '👑 Comandos de administrador',
            value: '`/agregaxp [usuario] [cantidad]` - Añadir XP a un usuario\n`/quitaxp [usuario] [cantidad]` - Quitar XP a un usuario\n`/establecernivel [usuario] [nivel] [xp]` - Establecer un nivel y XP específicos\n`/roles` - Gestión de roles de nivel'
          }
        )
        .setFooter({ text: 'Sistema de niveles' })
        .setTimestamp();
        
      interaction.reply({ embeds: [embed] });
      break;
    }
    
    // Nuevos comandos administrativos de rol
    case 'roles': {
      // Verificar permisos de administrador
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo los administradores pueden usar este comando', 
          ephemeral: true 
        });
      }
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'verificar': {
          await interaction.deferReply();
          
          try {
            const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Verificación de Roles')
            .setDescription('Todos los roles de nivel existen en el servidor.')
            .addFields(
                { name: 'Roles encontrados', value: LEVEL_ROLES.map(r => `- ${r.roleName} (Nivel ${r.minLevel}+)`).join('\n') }
            )
            .setFooter({ text: 'Sistema de roles' })
            .setTimestamp();
            
            interaction.editReply({ embeds: [embed] });
          } catch (error) {
            console.error('Error verificando roles:', error);
            interaction.editReply('❌ Ocurrió un error al verificar los roles');
          }
          break;
        }
        
        case 'sincronizar': {
          await interaction.deferReply();
          
          try {
            // Obtener todos los usuarios con nivel
            const users = await User.find({ guildId: interaction.guild.id });
            
            if (users.length === 0) {
              return interaction.editReply('❌ No hay usuarios con nivel en este servidor.');
            }
            
            // Contadores
            let updated = 0;
            let errors = 0;
            let skipped = 0;
            
            // Actualizar roles para cada usuario
            for (const userData of users) {
              try {
                // Intentar obtener el miembro
                const member = await interaction.guild.members.fetch(userData.userId).catch(() => null);
                
                if (!member) {
                  skipped++;
                  continue;
                }
                
                // Actualizar roles
                const result = await updateMemberRoles(member, userData.level);
                
                if (result.success) {
                  updated++;
                } else {
                  errors++;
                }
              } catch (err) {
                errors++;
                console.error(`Error sincronizando roles para ${userData.userId}:`, err);
              }
            }
            
            const embed = new EmbedBuilder()
              .setColor('#4287f5')
              .setTitle('🔄 Sincronización de Roles')
              .setDescription('Se ha completado la sincronización de roles basados en nivel.')
              .addFields(
                { name: '✅ Usuarios actualizados', value: updated.toString(), inline: true },
                { name: '⚠️ Errores', value: errors.toString(), inline: true },
                { name: '⏭️ Omitidos', value: skipped.toString(), inline: true }
              )
              .setFooter({ text: 'Sistema de roles' })
              .setTimestamp();
              
            interaction.editReply({ embeds: [embed] });
          } catch (error) {
            console.error('Error sincronizando roles:', error);
            interaction.editReply('❌ Ocurrió un error al sincronizar los roles');
          }
          break;
        }
      }
      break;
    }
    
    case 'agregaxp': {
      // Verificar permisos de administrador
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo los administradores pueden usar este comando', 
          ephemeral: true 
        });
      }
      
      await interaction.deferReply();
      
      try {
        const targetUser = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('cantidad');
        
        if (amount <= 0) {
          return interaction.editReply('❌ La cantidad debe ser un número positivo');
        }
        
        // Añadir XP
        const oldUser = await User.findOne({ userId: targetUser.id, guildId });
        const oldLevel = oldUser ? oldUser.level : 1;
        
        const updatedUser = await addXp(targetUser.id, guildId, amount);

        // Actualizar roles si hubo cambio de nivel
        if (updatedUser.level > oldLevel) {
            try {
            // Obtener el miembro del servidor
            const member = await interaction.guild.members.fetch(targetUser.id);
            const roleResult = await updateMemberRoles(member, updatedUser.level);
            
            // Si se añadió un nuevo rol, añadirlo al embed
            if (roleResult.success && roleResult.added) {
                embed.addFields(
                { name: '🏅 Nuevo Rango', value: `El usuario ha obtenido el rango **${roleResult.added}**` }
                );
            }
            } catch (roleError) {
            console.error('Error actualizando roles al agregar XP:', roleError);
            }
        }
        
        // Crear embed de confirmación
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ XP Añadida')
          .setDescription(`Se han añadido **${amount} XP** a ${targetUser}`)
          .addFields(
            { name: 'Nivel actual', value: `${updatedUser.level}`, inline: true },
            { name: 'XP actual', value: `${updatedUser.xp}/${calculateLevelXp(updatedUser.level)}`, inline: true }
          )
          .setFooter({ text: 'Sistema de niveles' })
          .setTimestamp();
          
        // Indicar si subió de nivel
        if (updatedUser.level > oldLevel) {
          embed.addFields(
            { name: '🎉 ¡Subida de nivel!', value: `El usuario ha subido del nivel ${oldLevel} al ${updatedUser.level}` }
          );
        }
        
        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al agregar XP:', error);
        interaction.editReply('❌ Ocurrió un error al agregar XP');
      }
      break;
    }
    
    case 'quitaxp': {
      // Verificar permisos de administrador
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo los administradores pueden usar este comando', 
          ephemeral: true 
        });
      }
      
      await interaction.deferReply();
      
      try {
        const targetUser = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('cantidad');
        
        if (amount <= 0) {
          return interaction.editReply('❌ La cantidad debe ser un número positivo');
        }
        
        // Obtener datos anteriores
        const oldUser = await User.findOne({ userId: targetUser.id, guildId });
        const oldLevel = oldUser ? oldUser.level : 1;
        
        // Quitar XP
        const updatedUser = await removeXp(targetUser.id, guildId, amount);

        // Actualizar roles si hubo cambio de nivel
        if (updatedUser.level < oldLevel) {
            try {
            // Obtener el miembro del servidor
            const member = await interaction.guild.members.fetch(targetUser.id);
            const roleResult = await updateMemberRoles(member, updatedUser.level);
            
            // Si cambió el rol, añadirlo al embed
            if (roleResult.success) {
                let roleMessage = 'El usuario ha perdido sus roles de nivel';
                
                if (roleResult.added) {
                roleMessage = `El usuario ahora tiene el rango **${roleResult.added}**`;
                }
                
                embed.addFields(
                { name: '🔄 Cambio de Rango', value: roleMessage }
                );
            }
            } catch (roleError) {
            console.error('Error actualizando roles al quitar XP:', roleError);
            }
        }
        
        // Crear embed de confirmación
        const embed = new EmbedBuilder()
          .setColor('#FF6347')
          .setTitle('✅ XP Quitada')
          .setDescription(`Se han quitado **${amount} XP** a ${targetUser}`)
          .addFields(
            { name: 'Nivel actual', value: `${updatedUser.level}`, inline: true },
            { name: 'XP actual', value: `${updatedUser.xp}/${calculateLevelXp(updatedUser.level)}`, inline: true }
          )
          .setFooter({ text: 'Sistema de niveles' })
          .setTimestamp();
          
        // Indicar si bajó de nivel
        if (updatedUser.level < oldLevel) {
          embed.addFields(
            { name: '⬇️ Bajada de nivel', value: `El usuario ha bajado del nivel ${oldLevel} al ${updatedUser.level}` }
          );
        }
        
        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al quitar XP:', error);
        interaction.editReply('❌ Ocurrió un error al quitar XP');
      }
      break;
    }
    
    case 'establecernivel': {
      // Verificar permisos de administrador
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo los administradores pueden usar este comando', 
          ephemeral: true 
        });
      }
      
      await interaction.deferReply();
      
      try {
        const targetUser = interaction.options.getUser('usuario');
        const level = interaction.options.getInteger('nivel');
        const xp = interaction.options.getInteger('xp') || 0;
        
        if (level < 1) {
          return interaction.editReply('❌ El nivel debe ser 1 o mayor');
        }
        
        if (xp < 0) {
          return interaction.editReply('❌ La XP no puede ser negativa');
        }
        
        // Establecer nivel y XP
        const updatedUser = await setLevelAndXp(targetUser.id, guildId, level, xp);

        // Actualizar roles según el nuevo nivel
        try {
            // Obtener el miembro del servidor
            const member = await interaction.guild.members.fetch(targetUser.id);
            const roleResult = await updateMemberRoles(member, updatedUser.level);
            
            // Si se actualizaron los roles, añadirlo al embed
            if (roleResult.success) {
            let roleMessage = 'Se han actualizado los roles del usuario';
            
            if (roleResult.added) {
                roleMessage = `El usuario ahora tiene el rango **${roleResult.added}**`;
            } else if (roleResult.removed.length > 0) {
                roleMessage = `Se han quitado los siguientes rangos: ${roleResult.removed.join(', ')}`;
            }
            
            embed.addFields(
                { name: '🔄 Actualización de Rango', value: roleMessage }
            );
            }
        } catch (roleError) {
            console.error('Error actualizando roles al establecer nivel:', roleError);
        }
        
        // Crear embed de confirmación
        const embed = new EmbedBuilder()
          .setColor('#1E90FF')
          .setTitle('✅ Nivel y XP Establecidos')
          .setDescription(`Se ha establecido el nivel de ${targetUser} a **${level}** con **${xp} XP**`)
          .addFields(
            { name: 'Nivel actual', value: `${updatedUser.level}`, inline: true },
            { name: 'XP actual', value: `${updatedUser.xp}/${calculateLevelXp(updatedUser.level)}`, inline: true }
          )
          .setFooter({ text: 'Sistema de niveles' })
          .setTimestamp();
        
        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al establecer nivel y XP:', error);
        interaction.editReply('❌ Ocurrió un error al establecer nivel y XP');
      }
      break;
    }
  }
});

client.login(process.env.TOKEN);