using Microsoft.EntityFrameworkCore;
using GreetingApi.Models;

namespace GreetingApi.Data;

public class GreetingDbContext : DbContext
{
    public GreetingDbContext(DbContextOptions<GreetingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Greeting> Greetings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Greeting>()
            .ToTable("greetings")
            .HasKey(g => g.Id);

        modelBuilder.Entity<Greeting>()
            .Property(g => g.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        modelBuilder.Entity<Greeting>()
            .Property(g => g.Name)
            .HasColumnName("name")
            .IsRequired();

        modelBuilder.Entity<Greeting>()
            .Property(g => g.Message)
            .HasColumnName("greeting")
            .IsRequired();

        modelBuilder.Entity<Greeting>()
            .Property(g => g.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}