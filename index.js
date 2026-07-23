require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// --- DANH SÁCH LỆNH SLASH ---
const commands = [
    // 1. Thông tin & Tiện ích
    new SlashCommandBuilder().setName('ping').setDescription('⚡ Kiểm tra độ trễ của Bot'),
    
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📊 Xem thông tin chi tiết về Server'),

    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Xem thông tin chi tiết của một thành viên')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên cần xem')),

    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Phóng to và tải ảnh đại diện của thành viên')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên cần lấy avatar')),

    // 2. Quản lý & Xử phạt (Chỉ Admin/Mod dùng)
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🧹 Dọn dẹp tin nhắn trong kênh')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('🔇 Cấm ngôn thành viên (Timeout)')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Số phút cấm').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('🔊 Mở cấm ngôn cho thành viên')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Cảnh cáo thành viên vi phạm')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Lý do cảnh cáo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('🚨 Kick thành viên khỏi server')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('⛔ Cấm thành viên vĩnh viễn')
        .addUserOption(opt => opt.setName('target').setDescription('Thành viên').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    // 3. Thông báo Admin & Minigame
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('📢 Dùng bot gửi tin nhắn thông báo dạng Embed')
        .addStringOption(opt => opt.setName('message').setDescription('Nội dung cần thông báo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('🎲 Quay số ngẫu nhiên (Dùng cho minigame/giveaway)')
        .addIntegerOption(opt => opt.setName('max').setDescription('Số tối đa (Mặc định: 100)'))
].map(cmd => cmd.toJSON());

// Khởi chạy Bot
client.once('ready', async () => {
    console.log(`✨ Bot [ ${client.user.tag} ] đã sẵn sàng hoạt động!`);
    client.user.setActivity('Quản lý Server 24/7 🛡️', { type: 3 });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Đang đồng bộ hệ thống lệnh Slash...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Đã đăng ký thành công hệ thống lệnh!');
    } catch (error) {
        console.error('❌ Lỗi đăng ký lệnh:', error);
    }
});

// Xử lý Lệnh
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options, guild, member } = interaction;

    // /PING
    if (commandName === 'ping') {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📡 Trạng Thái Kết Nối')
            .addFields(
                { name: '⚡ Độ trễ Bot', value: `\`${Date.now() - interaction.createdTimestamp}ms\``, inline: true },
                { name: '💻 API Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // /SERVERINFO
    if (commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`🏰 Thông Tin Server: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Chủ Server', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 Tổng Thành Viên', value: `\`${guild.memberCount}\` người`, inline: true },
                { name: '📁 Số Kênh', value: `\`${guild.channels.cache.size}\` kênh`, inline: true },
                { name: '📅 Ngày Tạo', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false }
            )
            .setFooter({ text: `ID: ${guild.id}` });
        return interaction.reply({ embeds: [embed] });
    }

    // /USERINFO
    if (commandName === 'userinfo') {
        const target = options.getMember('target') || member;
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`👤 Thông Tin: ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
                { name: '📅 Tạo Tài Khoản', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Tham Gia', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🏷️ Role', value: target.roles.cache.map(r => r).join(' ') || 'Không có' }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // /AVATAR
    if (commandName === 'avatar') {
        const user = options.getUser('target') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ size: 1024, dynamic: true });
        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle(`🖼️ Avatar của ${user.tag}`)
            .setImage(avatarUrl)
            .setDescription(`[👉 Tải ảnh gốc](${avatarUrl})`);
        return interaction.reply({ embeds: [embed] });
    }

    // /CLEAR
    if (commandName === 'clear') {
        const amount = options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '⚠️ Nhập từ 1 đến 100!', ephemeral: true });
        const deleted = await interaction.channel.bulkDelete(amount, true);
        const embed = new EmbedBuilder().setColor('#57F287').setDescription(`🧹 Đã xóa **${deleted.size}** tin nhắn.`);
        await interaction.reply({ embeds: [embed] });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
    }

    // /MUTE (TIMEOUT)
    if (commandName === 'mute') {
        const target = options.getMember('target');
        const minutes = options.getInteger('minutes');
        const reason = options.getString('reason') || 'Không có lý do';

        if (!target.moderatable) return interaction.reply({ content: '❌ Không thể cấm ngôn người này!', ephemeral: true });
        await target.timeout(minutes * 60 * 1000, reason);

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔇 CẤM NGÔN (TIMEOUT)')
            .addFields(
                { name: '👤 Thành viên', value: `${target.user.tag}` },
                { name: '⏱️ Thời gian', value: `\`${minutes} phút\`` },
                { name: '📝 Lý do', value: `\`${reason}\`` }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // /UNMUTE
    if (commandName === 'unmute') {
        const target = options.getMember('target');
        if (!target.moderatable) return interaction.reply({ content: '❌ Không thể gỡ phạt!', ephemeral: true });
        await target.timeout(null);
        return interaction.reply({ content: `🔊 Đã gỡ cấm ngôn cho **${target.user.tag}**.` });
    }

    // /WARN
    if (commandName === 'warn') {
        const target = options.getUser('target');
        const reason = options.getString('reason');

        const embed = new EmbedBuilder()
            .setColor('#E67E22')
            .setTitle('⚠️ CẢNH CÁO VI PHẠM')
            .addFields(
                { name: '👤 Thành viên', value: `${target.tag}` },
                { name: '🛡️ Người xử lý', value: `${interaction.user.tag}` },
                { name: '📝 Lý do', value: `\`${reason}\`` }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // /KICK & /BAN
    if (commandName === 'kick' || commandName === 'ban') {
        const target = options.getMember('target');
        const reason = options.getString('reason') || 'Không có lý do';
        if (!target || (commandName === 'kick' ? !target.kickable : !target.bannable)) {
            return interaction.reply({ content: '❌ Bot không đủ quyền phạt người này!', ephemeral: true });
        }
        if (commandName === 'kick') await target.kick(reason);
        else await target.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle(`🚨 XỬ LÝ: ${commandName.toUpperCase()}`)
            .addFields(
                { name: '👤 Thành viên', value: `${target.user.tag}` },
                { name: '📝 Lý do', value: `\`${reason}\`` }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // /SAY
    if (commandName === 'say') {
        const msg = options.getString('message');
        const embed = new EmbedBuilder().setColor('#5865F2').setDescription(msg);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '✅ Đã gửi thông báo!', ephemeral: true });
    }

    // /ROLL
    if (commandName === 'roll') {
        const max = options.getInteger('max') || 100;
        const result = Math.floor(Math.random() * max) + 1;
        return interaction.reply({ content: `🎲 **${interaction.user.username}** quay ra số: **${result}** (từ 1 - ${max})` });
    }
});

client.login(process.env.DISCORD_TOKEN);